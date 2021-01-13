import { Injectable } from '@angular/core';
import {JSParserService} from './j-s-parser.service';
import {JSgeneratorService} from './j-sgenerator.service';
import {Program} from 'esprima';
import {ArrayExpression, BaseNode, BinaryExpression, Literal, MemberExpression, UnaryExpression} from 'estree';

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
      const expression = node as BinaryExpression;
      if (this.isLiteral(expression.left) && this.isLiteral(expression.right)){
        const newValue = eval(expression.left.raw + expression.operator + expression.right.raw);
        const _node: Literal = {
          type: 'Literal',
          value: newValue,
          raw: typeof newValue === 'string' ? '\'' + newValue + '\'' : newValue;

        };
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
    if (node.type !== 'MemberExpression') {return false;}
    // object['lenght'] --> object.length
    const expression = node as MemberExpression;
    if (expression.computed && expression.property.type === 'Literal' && this.isValidProperty(expression.property.value)) {
      const _node: MemberExpression = {
        type: 'MemberExpression',
        computed: false,
        object: expression.object,
        property: {
          type: 'Identifier',
          name: expression.property.value
        },
        optional: expression.optional
      };

      return _node;
    }
    // WARNING if first matches, second one will only be executed at next iteration
    // 'abc'[0] --> 'a'
    if (expression.property.type === 'Literal' && expression.object.type === 'Literal'){
      const literal = node as Literal;
      const newValue = eval(expression.object.raw + '[' + expression.property.raw + ']');
      const _node = {
        type: 'Literal',
        value: newValue,
        raw: typeof newValue === 'string' ? '\'' + newValue + '\'' : newValue
      };

      return _node;
    }

    return false;
  }

  private isLiteral(node: BaseNode): boolean{
    if (node.type === 'ArrayExpression'){
      const expression = node as ArrayExpression;
      return expression.elements.length === 0;
    }
    return node.type === 'Literal';
  }

  private visit(node: BaseNode | Program, f: (node: BaseNode) => BaseNode): BaseNode | Program | boolean {
    let changed = false;
    if (!node) {
      return false;
    }
    const newNode = f(node);
    if (newNode){
      changed = true;
      node = newNode;
    }

    Object.keys(node).filter(key => {
      // @ts-ignore
      return typeof node[key] === 'object';
    }).forEach((key, index) => {
      // @ts-ignore
      const value: BaseNode = node[key] as BaseNode;
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
          // @ts-ignore
          node[key] = newNode;
        }
      }
    });
    return changed ? node : false;
  }

  private negativeNumbers(node: BaseNode): BaseNode | false {
    if (this.isLiteral(node)){
      const literal = node as Literal;
      if (typeof literal.value === 'number' && literal.value < 0){
        const newNode: UnaryExpression = {
          type: 'UnaryExpression',
          operator: '-',
          argument: {
            type: 'Literal',
            value: -literal.value,
            raw: -literal.value
          }
        }
        return newNode;
      }
    }
    return false;
  }

}
