import { Component, ElementRef, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { PostService } from '../../../common/services/post.service';

import { IFlogoApplicationModel } from '../../../common/application.model';
import { RESTAPIApplicationsService }  from '../../../common/services/restapi/applications-api.service';
import { notification } from '../../../common/utils';
import { ERROR_CONSTRAINT } from '../../../common/constants';
import { RESTAPITriggersService } from '../../../common/services/restapi/triggers-api.service';
import { RESTAPITriggersService as RESTAPITriggersServiceV2 } from '../../../common/services/restapi/v2/triggers-api.service';
import { PUB_EVENTS } from '../messages';

@Component({
  selector: 'flogo-select-trigger',
  moduleId: module.id,
  templateUrl: 'select-trigger.tpl.html',
  styleUrls: ['select-trigger.css']
})
export class FlogoSelectTriggerComponent implements OnInit, OnChanges {
  @Input() appId: string;
  public installedTriggers = [];
  public installTriggerActivated = false;
  public onInstalled = new EventEmitter();
  private addTriggerMsg : any;
  public displayExisting: boolean;

  public existingTriggers = [];


  constructor(public translate: TranslateService,
              private postService: PostService,
              private triggersService: RESTAPITriggersService,
              private triggersServiceV2: RESTAPITriggersServiceV2) {
    this.displayExisting = true;
  }

  ngOnInit() {
  }

  getExistingTriggers() {
    return this.triggersServiceV2.listTriggersApp(this.appId);
  }

  loadInstalledTriggers() {

    return this.triggersService.getTriggers()
      .then(
        ( triggers : any )=> {
          this.installedTriggers = triggers;
          return triggers;
        }
      )
      .then((installed) => {
        this.getExistingTriggers()
          .then((triggers) => {
            if(!triggers.length)  {
              this.displayExisting = false;
            }

            const allInstalled = {};

            installed.forEach((item) => {
              allInstalled[item.ref] = item;
            });

            this.existingTriggers = [];
            triggers.forEach((existing)=> {
              const found = allInstalled[existing.ref];
              found.id = existing.id;

              if(found) {
                this.existingTriggers.push(found);
              }
            });

          });

      })
      .then(()=> {
        return this.existingTriggers;
      })
      .catch(
        ( err : any )=> {
          console.error( err );
        }
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['appId']) {
      this.loadInstalledTriggers();
    }
  }


  public openInstallTriggerWindow() {
    this.installTriggerActivated = true;
  }

  public closeModal() {
    this.installTriggerActivated = false;
  }

  public onInstalledAction( response : any ) {
    this.loadInstalledTriggers();
    // bubble the event.
    this.onInstalled.emit( response );
  }

  sendAddTriggerMsg( trigger : any, installType: string ) {
    this.postService.publish(
      _.assign(
        {}, PUB_EVENTS.addTrigger, {
          data : _.assign(
            {},
            this.addTriggerMsg, { id: 'root' },
            { trigger : _.cloneDeep( trigger ) },
            { installType: installType }
          )
        }
      )
    );
  }
}
