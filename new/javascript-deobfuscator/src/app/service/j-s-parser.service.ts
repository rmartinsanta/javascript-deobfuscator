import { Injectable } from '@angular/core';
import * as esprima from 'esprima';
import {Program} from 'esprima';

@Injectable({
  providedIn: 'root'
})
export class JSParserService {

  constructor() { }

  /**
   * Parse Javascript code and return the AST (Abstract syntax tree).
   * Currently using esprima library
   * @param code JS code
   */
  parseJS(code: string): Program{
    return esprima.parseModule(code);
  }
}
