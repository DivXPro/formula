import { BailErrorStrategy, CharStreams, CommonTokenStream } from 'antlr4ts';
import {
  FieldTypeGet,
  FormulaParserCheckerImpl,
} from './formulaService/FormulaParserCheckerImpl';
import { FormulaParserChecker } from './formulaService/FormulaParserChecker';
import { DataType } from './formulaType/DateType';
import { CountErrorListener } from './formulaService/CountErrorListener';
import { TYPE } from './formulaType';
import { FormulaLexer } from './antlr/FormulaLexer';
import { FormulaParser, StatContext } from './antlr/FormulaParser';
import { FormulaParserRuner } from './formulaService/FormulaParserRuner';
import {
  FieldValueGet,
  FormulaParserRunerImpl,
} from './formulaService/FormulaParserRunerImpl';
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';
import FormulaErrorListener, {
  IFormulaError,
} from './formulaService/FormulaErrorListener';

const formulaParse = (
  formula: string,
  getFieldValue: FieldValueGet, // (pattern: string) => any = (pattern: string) => undefined,
) => {
  if (formula === '') {
    return {
      success: true,
      result: null,
    };
  }
  const lexerErrors = [];
  const chars = CharStreams.fromString(formula);
  const lexer = new FormulaLexer(chars);
  lexer.addErrorListener(new CountErrorListener((e) => lexerErrors.push(e)));
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new FormulaParser(tokenStream);
  parser.errorHandler = new BailErrorStrategy();
  parser.buildParseTree = true;
  try {
    const tree = parser.stat();
    const listener: FormulaParserRuner = new FormulaParserRunerImpl(
      getFieldValue,
    );
    ParseTreeWalker.DEFAULT.walk(listener, tree);
    if (lexerErrors.length > 0 || parser.numberOfSyntaxErrors > 0) {
      return {
        success: false,
        result: null,
      };
    }
    return listener.getResult();
  } catch {
    return {
      success: false,
      result: null,
    };
  }
};

const formulaParseType = (
  formula: string = '',
  getFieldType: FieldTypeGet,
  formulaRtType: DataType,
): { ast: StatContext; errors: IFormulaError[] } => {
  const inputStream = CharStreams.fromString(formula);
  const lexer = new FormulaLexer(inputStream);
  lexer.removeErrorListeners();
  const tbexpLangErrorsListner = new FormulaErrorListener();
  lexer.addErrorListener(tbexpLangErrorsListner);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new FormulaParser(tokenStream);
  parser.removeErrorListeners();
  parser.addErrorListener(tbexpLangErrorsListner);
  const ast = parser.stat();
  let errors: IFormulaError[] = tbexpLangErrorsListner.getErrors();
  if (errors.length > 0) {
    return { ast, errors };
  }
  const listener: FormulaParserChecker = new FormulaParserCheckerImpl(
    getFieldType,
    formulaRtType,
  );
  ParseTreeWalker.DEFAULT.walk(listener, ast);
  const typeErrors = listener.getErrors();
  if (typeErrors.length > 0) {
    errors = errors.concat(typeErrors);
  }
  console.log('parseTypeErrors', errors);
  return { ast, errors };
};

export function parseAndGetSyntaxErrors(
  code: string,
  getFieldType: FieldTypeGet,
  formulaRtType: DataType,
): IFormulaError[] {
  const { errors } = formulaParseType(code, getFieldType, formulaRtType);
  return errors;
}

export function parseResult(code: string, getFieldValue: FieldValueGet) {
  const result = formulaParse(code, getFieldValue);
  console.log(`计算结果：${code} = ${JSON.stringify(result)}`);
  return result;
}

export function formulaTreeTest(formula: string) {
  try {
    const chars = CharStreams.fromString(formula);
    const lexer = new FormulaLexer(chars);
    const tokens = new CommonTokenStream(lexer);
    const parser = new FormulaParser(tokens);
    parser.buildParseTree = true;
    const tree = parser.stat();
    return true;
  } catch {
    return false;
  }
}
