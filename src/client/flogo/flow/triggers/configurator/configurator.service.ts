import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {FlowMetadata} from '@flogo/core/interfaces/flow';
import {
  ModalStatus,
  SaveData,
  TriggerDetail,
  TriggerConfiguration,
  ConfiguratorStatus,
  TriggerStatus,
  MapperStatus,
  TriggerChanges
} from './interfaces';
import {MapperTranslator, MappingsValidatorFn, IMapping} from '../../shared/mapper';
import {reduce as arrayReduce} from 'lodash';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {isEqual} from 'lodash';
import {createTabs} from './core/utils';
import {TRIGGER_TABS} from './core/constants';

@Injectable()
export class ConfiguratorService {

  triggersToConfigure: Map<string, TriggerConfiguration> = new Map<string, TriggerConfiguration>();
  currentModalStatus: ModalStatus = {
    isOpen: false,
    flowMetadata: null,
    selectedTriggerID: null
  };

  configuratorStatus$ = new Subject<ConfiguratorStatus>();
  triggerMapperStatus$ = new BehaviorSubject<MapperStatus>(undefined);
  save$ = new Subject<SaveData[]>();

  private mappingValidationFn: MappingsValidatorFn = MapperTranslator.makeValidator();

  open(triggers: TriggerDetail[], flowMetadata: FlowMetadata, triggerId: string) {
    this.currentModalStatus = {
      ...this.currentModalStatus,
      isOpen: true,
      flowMetadata,
      selectedTriggerID: triggerId
    };
    this.initTriggersData(triggers);
    this.publishCompleteStatuses();
  }

  close() {
    this.reset();
    this.publishCompleteStatuses();
  }

  save() {
    const prepareSavableData = (triggerConfiguration: TriggerConfiguration) => ({
      trigger: triggerConfiguration.trigger,
      mappings: triggerConfiguration.changedMappings
    });
    const dataToSave = Array.from(this.triggersToConfigure.values()).filter(t => t.isDirty).map(prepareSavableData);
    this.save$.next(dataToSave);
    this.close();
  }

  selectTrigger(triggerId: string) {
    this.currentModalStatus.selectedTriggerID = triggerId;
    this.publishChangedTriggerSelection();
  }

  updateTriggerConfiguration(newConfigurations: TriggerChanges) {
    const triggerToUpdate = {
      ...this.triggersToConfigure.get(this.currentModalStatus.selectedTriggerID),
      ...newConfigurations
    };
    triggerToUpdate.isDirty = !isEqual(triggerToUpdate.changedMappings.actionMappings, triggerToUpdate.handler.actionMappings);
    this.triggersToConfigure.set(this.currentModalStatus.selectedTriggerID, triggerToUpdate);
    this.publishConfigurationChanges();
  }

  areValidMappings(mappings: IMapping) {
    return this.mappingValidationFn(mappings);
  }

  private initTriggersData(triggerDetailsList: TriggerDetail[]) {
    arrayReduce(triggerDetailsList, (triggersMap, triggerDetail) => {
      const triggerConfiguration: TriggerConfiguration = {
        ...triggerDetail,
        isValid: true,
        isDirty: false,
        tabs: createTabs(triggerDetail.triggerSchema, this.currentModalStatus.flowMetadata)
      };
      const { input, output } = triggerDetail.handler.actionMappings;
      const mappings = {
        input: MapperTranslator.translateMappingsIn(input),
        output: MapperTranslator.translateMappingsIn(output)
      };
      triggerConfiguration.tabs.get(TRIGGER_TABS.MAP_FLOW_INPUT).isValid = this.areValidMappings({
        mappings: mappings.input
      });
      triggerConfiguration.tabs.get(TRIGGER_TABS.MAP_FLOW_OUTPUT).isValid = this.areValidMappings({
        mappings: mappings.output
      });
      triggerConfiguration.isValid = triggerConfiguration.tabs.areValid();
      return triggersMap.set(triggerDetail.trigger.id, triggerConfiguration);
    }, this.triggersToConfigure);
  }

  private publishCompleteStatuses() {
    const triggerToConfigure = this.triggersToConfigure.get(this.currentModalStatus.selectedTriggerID);
    this.configuratorStatus$.next({
      isOpen: this.currentModalStatus.isOpen,
      disableSave: true,
      selectedTriggerID: this.currentModalStatus.selectedTriggerID,
      triggers: this.getTriggerStatusForAll()
    });
    this.triggerMapperStatus$.next({
      flowMetadata: this.currentModalStatus.flowMetadata,
      triggerSchema: (triggerToConfigure && triggerToConfigure.triggerSchema) || null,
      handler: (triggerToConfigure && triggerToConfigure.handler) || null,
      tabs: (triggerToConfigure && triggerToConfigure.tabs) || null
    });
  }

  private publishChangedTriggerSelection() {
    const triggerToConfigure = this.triggersToConfigure.get(this.currentModalStatus.selectedTriggerID);
    const mapperNextStatus: MapperStatus = {
      flowMetadata: this.currentModalStatus.flowMetadata,
      triggerSchema: triggerToConfigure.triggerSchema,
      handler: triggerToConfigure.handler,
      changedMappings: triggerToConfigure.changedMappings || null,
      tabs: triggerToConfigure.tabs || null
    };
    this.configuratorStatus$.next({
      selectedTriggerID: this.currentModalStatus.selectedTriggerID
    });
    this.triggerMapperStatus$.next(mapperNextStatus);
  }

  private publishConfigurationChanges() {
    // update save button state, triggers in the configuratorStatus
    this.configuratorStatus$.next({
      disableSave: this.isSaveDisabled(),
      triggers: this.getTriggerStatusForAll()
    });
  }

  private reset() {
    this.currentModalStatus = {
      isOpen: false,
      flowMetadata: null,
      selectedTriggerID: null
    };
    this.triggersToConfigure.clear();
  }

  private isSaveDisabled() {
    const allTriggers = Array.from(this.triggersToConfigure.values());
    const hasInvalidTriggerMappings = !!allTriggers.find(triggerObj => !triggerObj.isValid);
    const hasModifiedTriggerMapping = !!allTriggers.find(triggerObj => triggerObj.isDirty);
    return !hasModifiedTriggerMapping || hasInvalidTriggerMappings;
  }

  private getTriggerStatusForAll(): TriggerStatus[] {
    return Array.from(this.triggersToConfigure.values()).map((triggerConfig: TriggerConfiguration) => ({
      id: triggerConfig.trigger.id,
      isDirty: triggerConfig.isDirty,
      isValid: triggerConfig.isValid,
      name: triggerConfig.trigger.name
    }));
  }
}
