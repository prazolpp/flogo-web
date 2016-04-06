import {FLOGO_TASK_ATTRIBUTE_TYPE} from '../../../common/constants';

export class FlogoTaskFieldBaseComponent{
  schema: any;
  value: any;
  fieldSubject: any;
  parameterType: string;

  onChangeField() {
    var changedObject = {
      name: this.schema.name,
      parameterType: this.parameterType,
      value: this.value
    };

    this.fieldSubject.next(changedObject);
  }

  updateValue(parameterType:string, name:string, value:string) {
    if(parameterType === this.parameterType && this.schema.name === name) {
      this.value = value;
    }
  }

  setConfiguration(fieldSchema:any, fieldSubject:any, parameterType:any) {
    this.schema = fieldSchema;
    this.fieldSubject = fieldSubject;

    this.parameterType = parameterType;

    switch(fieldSchema.type) {
      case FLOGO_TASK_ATTRIBUTE_TYPE.OBJECT:
          this.value = JSON.stringify(fieldSchema.value, null, 2);
          break;

      case FLOGO_TASK_ATTRIBUTE_TYPE.BOOLEAN:
        if(typeof fieldSchema.value === "string") {
          this.value = (fieldSchema.value === 'true');
        }else {
          this.value = fieldSchema.value;
        }
        break;

      default:
        this.value = fieldSchema.value;
        break;
    }

  }

  getParameterType() {
    return this.parameterType;
  }

  exportToJson() {
    return {
      [this.schema.name]: this.value
    }
  }

}
