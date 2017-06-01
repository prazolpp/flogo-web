import { ActionsManager } from '../../modules/actions';
import { ActionCompiler } from '../../modules/engine';
import { ErrorManager, ERROR_TYPES } from '../../common/errors';

export function actions(router, basePath) {
  router.get(`${basePath}/apps/:appId/actions`, listActions);
  router.post(`${basePath}/apps/:appId/actions`, createAction);
  router.get(`${basePath}/actions/:actionId`, getAction);
  router.get(`${basePath}/actions/recent`, listRecentActions);
  router.patch(`${basePath}/actions/:actionId`, updateAction);
  router.del(`${basePath}/actions/:actionId`, deleteAction);

  router.get(`${basePath}/actions/:actionId/build`, makeBuild);
}

function* listActions() {
  const appId = this.params.appId;

  const searchTerms = {};
  const filterName = this.request.query['filter[name]'];
  if (filterName) {
    searchTerms.name = filterName;
  }

  const actionList = yield ActionsManager.list(appId, searchTerms);
  this.body = {
    data: actionList || [],
  };
}

function* listRecentActions() {
  const appId = this.params.appId;
  this.body = { appId };

  const actionList = yield ActionsManager.listRecent();
  this.body = {
    data: actionList || [],
  };
}

function* createAction() {
  const appId = this.params.appId;
  const body = this.request.body;
  try {
    const action = yield ActionsManager.create(appId, body);
    this.body = {
      data: action,
    };
  } catch (error) {
    if (error.isOperational && error.type === ERROR_TYPES.COMMON.VALIDATION) {
      throw ErrorManager.createRestError('Validation error in /actions create action', {
        status: 400,
        title: 'Validation error',
        detail: 'There were one or more validation problems',
        meta: error.details.errors,
      });
    } else if (error.type === ERROR_TYPES.COMMON.NOT_FOUND) {
      throw ErrorManager.createRestNotFoundError('Application not found', {
        title: 'Application not found',
        detail: 'No application with the specified id',
      });
    }
    throw error;
  }
}

function* getAction() {
  const actionId = this.params.actionId;

  const action = yield ActionsManager.findOne(actionId);

  if (!action) {
    throw ErrorManager.createRestNotFoundError('Action not found', {
      title: 'Action not found',
      detail: 'No action with the specified id',
      value: actionId,
    });
  }

  this.body = {
    data: action,
  };
}

function* updateAction() {
  const actionId = this.params.actionId;
  const data = this.request.body || {};
  try {
    const app = yield ActionsManager.update(actionId, data);

    this.body = {
      data: app,
    };
  } catch (error) {
    if (error.isOperational) {
      if (error.type === ERROR_TYPES.COMMON.VALIDATION) {
        throw ErrorManager.createRestError('Validation error in /action updateAction', {
          status: 400,
          title: 'Validation error',
          detail: 'There were one or more validation problems',
          meta: error.details.errors,
        });
      } else if (error.type === ERROR_TYPES.COMMON.NOT_FOUND) {
        throw ErrorManager.createRestNotFoundError('Action not found', {
          title: 'Action not found',
          detail: 'No action with the specified id',
          value: actionId,
        });
      }
    }
    throw error;
  }
}


function* deleteAction() {
  const actionId = this.params.actionId;
  const removed = yield ActionsManager.remove(actionId);

  if (!removed) {
    throw ErrorManager.createRestNotFoundError('Action not found', {
      title: 'Action not found',
      detail: 'No action with the specified id',
      value: actionId,
    });
  }

  this.status = 204;
}

function* makeBuild(next) {
  const actionId = this.params.actionId;

  let compileOptions;
  // TODO: make sure os and arch are valid
  if (this.query.os || this.query.arch) {
    const { os, arch } = this.query;
    compileOptions = { os, arch };
  }

  const exportedAction = yield ActionsManager.exportToFlow(actionId);

  if (!exportedAction) {
    throw ErrorManager.createRestNotFoundError('Action not found', {
      title: 'Action not found',
      detail: 'No action with the specified id',
      value: actionId,
    });
  }

  const { trigger, flow } = exportedAction;
  this.body = yield ActionCompiler.compileFlow(trigger, flow, compileOptions);
  this.type = 'application/octet-stream';
  this.attachment();

  yield next;
}
