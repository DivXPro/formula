import { formulaParse } from '../index';

test('run 1 + 2 to equal 3', () => {
  expect(formulaParse('1 + 2').result).toBe(3);
});

test('sum 1 and 2 to equal 3', () => {
  expect(formulaParse('SUM(1, 2)').result).toBe(3);
});

test('sum 1 and 2 + field to equal 4', () => {
  expect(formulaParse('SUM(1, 2) + {!field}', () => 1).result).toBe(4);
});

test('concat "A" and " " to equal "A "', () => {
  expect(formulaParse('CONCATENATE("A", " ")', () => 1).result).toBe('A ');
});
