import {Component} from 'angular2/core';
import {ROUTER_DIRECTIVES} from 'angular2/router';
import {FlogoFormBuilderFieldsBase} from '../fields.base/fields.base.component';

@Component({
  selector: 'flogo-form-builder-fields-radio',
  styleUrls: ['fields.radio.css'],
  moduleId: module.id,
  templateUrl: 'fields.radio.tpl.html',
  directives: [ROUTER_DIRECTIVES],
  inputs:['_info:info','_observer:observer','_observerError:observerError']
})

export class FlogoFormBuilderFieldsRadio extends FlogoFormBuilderFieldsBase {
  _info:any;
  _observer:any;
  _observerError:any;

}
