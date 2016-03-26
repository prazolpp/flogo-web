import {Injectable} from 'angular2/core';

@Injectable()
export class PostService{

  constructor(){
    if(!postal){
      console.error("PostService is depended on postal, it seems you didn't load postal");
    }
  }

  publish(envelope:any){
    return postal.publish(envelope);
  }

  subscribe(options:any){
    return postal.subscribe(options);
  }

  unsubscribe(sub:any){
    return postal.unsubscribe(sub);
  }
}