import { Injectable } from '@angular/core';
import * as escodegen from 'escodegen';
import {Program} from 'esprima';

@Injectable({
  providedIn: 'root'
})
export class JSgeneratorService {

  constructor() {}

  /**
   * Generate Javascript code from the AST (Abstract Syntax Tree)
   * @param ast ast
   */
  generateCode(ast: Program): string {
    return escodegen.generate(ast);
  }

}
