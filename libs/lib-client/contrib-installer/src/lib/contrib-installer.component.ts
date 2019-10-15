import { Component, HostBinding } from '@angular/core';
import { ContributionsService } from '@flogo-web/lib-client/core';

import {
  FLOGO_INSTALLER_STATUS_STANDBY,
  FLOGO_INSTALLER_STATUS_IDLE,
  FLOGO_INSTALLER_STATUS_INSTALL_FAILED,
  FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS,
  FLOGO_INSTALLER_STATUS_INSTALLING,
} from './constants';
import { ContribInstallerService } from './contrib-installer.service';
import { modalAnimate, ModalControl } from '@flogo-web/lib-client/modal';

@Component({
  selector: 'flogo-contrib-installer',
  templateUrl: 'contrib-installer.component.html',
  styleUrls: ['contrib-installer.component.less'],
  animations: modalAnimate,
})
export class FlogoInstallerComponent {
  @HostBinding('@modalAnimate')
  _isActivated: boolean;

  showBlock = {
    standByMode: FLOGO_INSTALLER_STATUS_STANDBY,
    installingMode: FLOGO_INSTALLER_STATUS_INSTALLING,
    installFailedMode: FLOGO_INSTALLER_STATUS_INSTALL_FAILED,
    installSuccessMode: FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS,
  };

  query = '';

  _status = FLOGO_INSTALLER_STATUS_IDLE;
  status: string;
  constructor(
    private contributionsAPIs: ContributionsService,
    private contribInstallerService: ContribInstallerService,
    public control: ModalControl
  ) {
    this.init();
  }

  init() {
    this._status = FLOGO_INSTALLER_STATUS_STANDBY;
  }

  openModal(event?: any) {
    console.log('Open Modal.');
    this._status = FLOGO_INSTALLER_STATUS_STANDBY;
  }

  closeModal() {
    console.log('Close Modal.');
    this.status = 'cancel';
    this.control.close(this.status);
  }

  updateInstalledTriggers() {
    this.status = 'success';
    this.control.close(this.status);
  }

  onInstallAction(url: string) {
    console.group(`[FlogoInstallerComponent] onInstallAction`);
    console.log(`Source URL: ${url} `);

    const self = this;

    self._status = FLOGO_INSTALLER_STATUS_INSTALLING;

    this.contributionsAPIs
      .installContributions({
        url,
      })
      .toPromise()
      .then(result => {
        self._status = FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS;
        console.groupEnd();
        return this.contributionsAPIs.getContributionDetails(result.ref);
      })
      .then(contribDetails => {
        this.contribInstallerService.afterContribInstalled(contribDetails);
      })
      .catch(err => {
        console.error(err);
        self._status = FLOGO_INSTALLER_STATUS_INSTALL_FAILED;
        console.groupEnd();
      });
  }
}
