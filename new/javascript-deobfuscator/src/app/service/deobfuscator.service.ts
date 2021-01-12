import { Injectable } from '@angular/core';
import {JSParserService} from './j-s-parser.service';
import {JSgeneratorService} from './j-sgenerator.service';
import {Program} from 'esprima';
import {BaseNode, Literal, UnaryExpression} from 'estree';

@Injectable({
  providedIn: 'root'
})
export class DeobfuscatorService {

  constructor(private parser: JSParserService, private generator: JSgeneratorService) { }

  private propertyRegex = /[0-9a-zA-Z$_]+/;

  private transformations = [this.inmediateUnaryExpression, this.inmediateBinaryExpression, this.simplifyComputedMemberExpression];
  private postProcessing = [this.negativeNumbers];

  deobfuscate(code: string): string{
    const ast = this.parser.parseJS(code);
    const transformedAST = this.applyTransformations(ast);
    const transformedCode = this.generator.generateCode(transformedAST);
    return transformedCode;
  }

  private applyTransformations(ast: Program): Program{
    let transformed = true;
    while (transformed){
      transformed = false;
      for (let i = 0; i < this.transformations.length; i++) {
        const result = this.visit(ast, this.transformations[i]);
        if (result){
          ast = result;
          transformed = true;
        }
      }
    }
    for (let i = 0; i < this.postProcessing.length; i++) {
      const result = this.visit(ast, this.postProcessing[i]);
      if (result){
        ast = result;
      }
    }
    return ast;
  }


// Transforms !![] and ![] !0, !7, etc into the correct values.
  private inmediateUnaryExpression(node: BaseNode): BaseNode | boolean {
    if (node.type === 'UnaryExpression'){
      const expression = node as UnaryExpression;
      const newValue = eval(expression.operator + expression.argument.raw);
      if (this.isLiteral(expression.argument)){
        const _node: Literal = {
          type: 'Literal',
          value: newValue,
          raw: (typeof newValue === 'string') ? '\'' + newValue + '\'' : newValue
        };
        return _node;
      }
    }
    return false;
  }

  private inmediateBinaryExpression(node: BaseNode): BaseNode | boolean {
    if (node.type === 'BinaryExpression'){
      if (this.isLiteral(node.left) && this.isLiteral(node.right)){
        const _node = {};
        _node.type = 'Literal';
        _node.value = eval(node.left.raw + node.operator + node.right.raw);
        _node.raw = typeof _node.value === 'string' ? '\'' + _node.value + '\'' : _node.value;
        return _node;
      }
    }
    return false;
  }

  private isDigit(c: string): boolean{
    return c >= '0' && c <= '9';
  }

  private isValidProperty(s: any): boolean{
    return typeof s === 'string' && !this.isDigit(s.charAt(0)) && this.propertyRegex.test(s);
  }

  private simplifyComputedMemberExpression(node: BaseNode): BaseNode | boolean {
    if (node.type !== 'MemberExpression') { return false;}
    // object['lenght'] --> object.length
    if (node.computed && node.property.type === 'Literal' && this.isValidProperty(node.property.value)) {
      const _node = {};
      _node.type = 'MemberExpression';
      _node.computed = false;
      _node.object = node.object;
      _node.property = {
        type: 'Identifier',
        name: node.property.value
      };
      _node.optional = node.optional;
      return _node;
    }
    // WARNING if first matches, second one will only be executed at next iteration
    // 'abc'[0] --> 'a'
    if (node.property.type === 'Literal' && node.object.type === 'Literal'){
      const _node = {};
      _node.type = 'Literal';
      _node.value = eval(node.object.raw + '[' + node.property.raw + ']');
      _node.raw = typeof _node.value === 'string' ? '\'' + _node.value + '\'' : _node.value;
      return _node;
    }

    return false;
  }

  private isLiteral(node: BaseNode): boolean{
    if (node.type === 'ArrayExpression' && node.elements.length === 0){
      return true;
    }
    return node.type === 'Literal';
  }

  private visit(node: BaseNode, f){
    let changed = false;
    if (!node) {
      return;
    }
    const newNode = f(node);
    if (newNode){
      changed = true;
      node = newNode;
    }

    Object.keys(node).filter(key => {
      return typeof node[key] === 'object';
    }).forEach((key, index) => {
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const newNode = this.visit(item, f);
          if (newNode){
            changed = true;
            value[index] = newNode;
          }
        });
      } else {
        const newNode = this.visit(value, f);
        if (newNode){
          changed = true;
          node[key] = newNode;
        }
      }
    });
    return changed ? node : null;
  }

  private negativeNumbers(node: BaseNode){
    if (this.isLiteral(node)){
      if (typeof node.value === 'number' && node.value < 0){
        node.type = 'UnaryExpression';
        node.operator = '-';
        node.argument = {type: 'Literal', value: -node.value, raw: -node.value};
      }
    }
  }

}
