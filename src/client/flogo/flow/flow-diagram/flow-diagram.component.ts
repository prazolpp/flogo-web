import {Component, Output, EventEmitter} from '@angular/core';
import { select, Store } from '@ngrx/store';
import {Observable} from 'rxjs';

import { FlowState, FlowActions, FlowSelectors } from '../core/state';
import {DiagramAction, DiagramActionType, DiagramSelection} from '@flogo/packages/diagram';
import {HandlerType} from '@flogo/flow/core/models';
import {DiagramActionChild, DiagramActionSelf} from '@flogo/packages/diagram/interfaces';
import {takeUntil} from 'rxjs/operators';
import {SingleEmissionSubject} from '@flogo/core/models';
import {newBranchId} from '@flogo/flow/core/models/flow/id-generator';
import {FlowGraph} from '@flogo/core';

@Component({
  selector: 'flogo-flow-diagram',
  templateUrl: 'flow-diagram.component.html',
})

export class FlogoFlowDiagramComponent {
  @Output() deleteTask = new EventEmitter<{ handlerType: HandlerType, itemId: string }>();
  items$: Observable<FlowGraph>;
  currentSelection$: Observable<DiagramSelection>;
  currentDiagramId: HandlerType;
  private ngOnDestroy$ = SingleEmissionSubject.create();

  constructor(private store: Store<FlowState>) {
    this.items$ = this.store.pipe(
      select(FlowSelectors.getCurrentGraph),
      takeUntil(this.ngOnDestroy$)
    );
    this.currentSelection$ = this.store.pipe(select(FlowSelectors.getSelectionForCurrentHandler),
      takeUntil(this.ngOnDestroy$));
    this.store.pipe(select(FlowSelectors.getCurrentHandlerId),
      takeUntil(this.ngOnDestroy$)).subscribe(handlerType => {
      this.currentDiagramId = handlerType;
    });
  }


  onDiagramAction(diagramAction: DiagramAction) {
    switch (diagramAction.type) {
      case DiagramActionType.Select: {
        return this.store.dispatch(new FlowActions.SelectItem({
          handlerType: this.currentDiagramId,
          itemId: (<DiagramActionSelf>diagramAction).id,
        }));
      }
      case DiagramActionType.Configure: {
        return this.store.dispatch(new FlowActions.ConfigureItem({
          itemId: (<DiagramActionSelf>diagramAction).id,
        }));
      }
      case DiagramActionType.Insert: {
        return this.store.dispatch(new FlowActions.SelectCreateItem({
          handlerType: this.currentDiagramId,
          parentItemId: (<DiagramActionChild>diagramAction).parentId,
        }));
      }
      case DiagramActionType.Branch: {
        return this.store.dispatch(new FlowActions.CreateBranch({
          handlerType: this.currentDiagramId,
          parentId: (<DiagramActionChild>diagramAction).parentId,
          newBranchId: newBranchId(),
        }));
      }
      case DiagramActionType.Remove: {
       return this.deleteTask.emit({handlerType: this.currentDiagramId, itemId: (<DiagramActionSelf>diagramAction).id});
      }
    }
  }
}
