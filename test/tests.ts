import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { buildSync } from 'esbuild';
import * as rouge from '../src/rouge';

const bracketPairs = [
  ['(', ')'],
  ['[', ']'],
  ['{', '}'],
  ['<', '>'],
] as const;

describe('Utility Functions', () => {
  describe('fact', () => {
    const { fact } = rouge;

    test('should throw RangeError for -1!', () => {
      expect(() => fact(-1)).toThrow(RangeError);
    });

    test('should return 1 for 0!', () => {
      expect(fact(0)).toBe(1);
    });
    test('should return 1 for 1!', () => {
      expect(fact(1)).toBe(1);
    });

    test('should return 120 for 5!', () => {
      expect(fact(5)).toBe(120);
    });
    test('should return 3628800 for 10!', () => {
      expect(fact(10)).toBe(3_628_800);
    });
    test('should return 2432902008176640000 for 20!', () => {
      expect(fact(20)).toBe(2_432_902_008_176_640_000);
    });
    test('should return 2432902008176640000 for 20! using cache', () => {
      expect(fact(20)).toBe(2_432_902_008_176_640_000);
    });
  });

  describe('comb2', () => {
    const { comb2 } = rouge;

    test('should throw RangeError for C(1,2)', () => {
      expect(() => comb2(1)).toThrow(RangeError);
    });

    test('should return 1 for C(2,2)', () => {
      expect(comb2(2)).toBe(1);
    });
    test('should return 45 for C(10,2)', () => {
      expect(comb2(10)).toBe(45);
    });
    test('should return 499500 for C(1000,2)', () => {
      expect(comb2(1000)).toBe(499_500);
    });
  });

  describe('arithmeticMean', () => {
    const am = rouge.arithmeticMean;

    test('should throw RangeError for empty array', () => {
      expect(() => am([])).toThrow(RangeError);
    });

    test('should return singleton value of singleton array', () => {
      expect(am([5])).toBe(5);
    });
    test('should return value of homogeneous array', () => {
      expect(am([5, 5, 5])).toBe(5);
    });

    test('should return 2 for [1, 2, 3]', () => {
      expect(am([1, 2, 3])).toBe(2);
    });
    test('should return 2.5 for [1, 2, 3, 4]', () => {
      expect(am([1, 2, 3, 4])).toBe(2.5);
    });
  });

  describe('intersection', () => {
    const ins = rouge.intersection;

    test('should return empty array for two empty inputs', () => {
      expect(ins([], [])).toEqual([]);
    });
    test('should return empty array for first empty input', () => {
      expect(ins([], ['2'])).toEqual([]);
    });
    test('should return empty array for second empty input', () => {
      expect(ins(['2'], [])).toEqual([]);
    });

    test('should return singleton value of singleton array', () => {
      expect(ins(['2'], ['2'])).toEqual(['2']);
    });
    test('should return identical value of identical arrays', () => {
      expect(ins(['1', '2', '3'], ['1', '2', '3'])).toEqual(['1', '2', '3']);
    });

    test('should return ["2"] for ["1", "2", "3"] and ["2", "4", "6"]', () => {
      expect(ins(['1', '2', '3'], ['2', '4', '6'])).toEqual(['2']);
    });
    test('should return ["2", "3"] for ["1", "2", "3"] and ["2", "3", "6"]', () => {
      expect(ins(['1', '2', '3'], ['2', '3', '6'])).toEqual(['2', '3']);
    });
    test('should retain set semantics for repeated elements', () => {
      expect(ins(['a', 'a', 'b'], ['a', 'a', 'a'])).toEqual(['a']);
    });
    test('should return ["1", "2", "3"] for ["1", "2", "3"] and ["1", "2", "3", "6"]', () => {
      expect(ins(['1', '2', '3'], ['1', '2', '3', '6'])).toEqual(['1', '2', '3']);
    });
  });

  describe('lcs', () => {
    const { lcs } = rouge;

    test('should return empty array for empty first input', () => {
      expect(lcs([], ['1'])).toEqual([]);
    });
    test('should return empty array for empty second input', () => {
      expect(lcs(['1'], [])).toEqual([]);
    });
    test('should return empty array for unique inputs', () => {
      expect(lcs(['1'], ['2'])).toEqual([]);
    });
    test('should return singleton value for singleton inputs', () => {
      expect(lcs(['1'], ['1'])).toEqual(['1']);
    });

    test('should return ["1", "1"] for ["1", "1"] and ["2", "1", "1", "3"]', () => {
      expect(lcs(['1', '1'], ['2', '1', '1', '3'])).toEqual(['1', '1']);
    });
    test('should return ["2", "3"] for ["1", "2", "3"] and ["2", "3", "5"]', () => {
      expect(lcs(['1', '2', '3'], ['2', '3', '5'])).toEqual(['2', '3']);
    });
    test('should preserve its choice when multiple longest subsequences exist', () => {
      expect(lcs(['a', 'b'], ['b', 'a'])).toEqual(['b']);
    });
    test('should return ["w1", "w3", "w5"] for ["w1", "w2", "w3", "w4", "w5"] and ["w1", "w3", "w8", "w9", "w5"]', () => {
      expect(lcs(['w1', 'w2', 'w3', 'w4', 'w5'], ['w1', 'w3', 'w8', 'w9', 'w5'])).toEqual([
        'w1',
        'w3',
        'w5',
      ]);
    });
  });

  describe('nGram', () => {
    const { nGram } = rouge;
    const data = ['a', 'b', 'c', 'd'];

    test('should throw RangeError for ngram size < 1', () => {
      expect(() => nGram(data, 0)).toThrow(RangeError);
    });
    test('should throw RangeError for invalid ngram size', () => {
      expect(() => nGram(data, 5)).toThrow(RangeError);
    });

    test("should return ['a', 'b', 'c', 'd'] for n = 1", () => {
      expect(nGram(data, 1)).toEqual(['a', 'b', 'c', 'd']);
    });
    test("should return ['a b', 'b c', 'c d'] for n = 2", () => {
      expect(nGram(data)).toEqual(['a b', 'b c', 'c d']);
    });
    test("should return ['a b c', 'b c d'] for n = 3", () => {
      expect(nGram(data, 3)).toEqual(['a b c', 'b c d']);
    });
    test("should return ['a b c d'] for n = 4", () => {
      expect(nGram(data, 4)).toEqual(['a b c d']);
    });

    test('should pad only the start of the string', () => {
      expect(nGram(data, 4, { start: true })).toEqual([
        '<S> <S> <S> a',
        '<S> <S> a b',
        '<S> a b c',
        'a b c d',
      ]);
    });
    test('should pad only the end of the string', () => {
      expect(nGram(data, 4, { end: true })).toEqual([
        'a b c d',
        'b c d <S>',
        'c d <S> <S>',
        'd <S> <S> <S>',
      ]);
    });
    test('should pad both the start and end of the string', () => {
      expect(nGram(data, 4, { start: true, end: true })).toEqual([
        '<S> <S> <S> a',
        '<S> <S> a b',
        '<S> a b c',
        'a b c d',
        'b c d <S>',
        'c d <S> <S>',
        'd <S> <S> <S>',
      ]);
    });
    test('should change the padding word', () => {
      expect(nGram(data, 4, { start: true, val: '<UNK>' })).toEqual([
        '<UNK> <UNK> <UNK> a',
        '<UNK> <UNK> a b',
        '<UNK> a b c',
        'a b c d',
      ]);
    });
  });

  describe('skipBigram', () => {
    const sb = rouge.skipBigram;

    const data = ['a', 'b', 'c', 'd'];
    const result = ['a b', 'a c', 'a d', 'b c', 'b d', 'c d'];

    test('should throw RangeError for inputs with insufficient words', () => {
      expect(() => sb(['a'])).toThrow(RangeError);
    });

    test('should return the correct result', () => {
      expect(sb(data)).toEqual(result);
    });

    test('should return all pairs with default maxSkip (Infinity)', () => {
      expect(sb(data, Number.POSITIVE_INFINITY)).toEqual(result);
    });

    test('should return only adjacent pairs with maxSkip=1', () => {
      expect(sb(data, 1)).toEqual(['a b', 'b c', 'c d']);
    });

    test('should return pairs within skip distance of 2', () => {
      expect(sb(data, 2)).toEqual(['a b', 'a c', 'b c', 'b d', 'c d']);
    });

    test('should return pairs within skip distance of 3', () => {
      expect(sb(data, 3)).toEqual(['a b', 'a c', 'a d', 'b c', 'b d', 'c d']);
    });
  });

  describe('sentenceSegment', () => {
    const ss = rouge.sentenceSegment;

    test('should return empty array for empty input', () => {
      expect(ss('')).toEqual([]);
    });

    // Golden Rule tests from https://github.com/diasks2/pragmatic_segmenter
    // =====================================================================

    test('should split simple periods', () => {
      expect(ss('Hello World. My name is Jonas.')).toEqual(['Hello World.', 'My name is Jonas.']);
    });

    test('should split end-of-sentence question marks', () => {
      expect(ss('What is your name? My name is Jonas.')).toEqual([
        'What is your name?',
        'My name is Jonas.',
      ]);
    });

    test('should split end-of-sentence exclamation marks', () => {
      expect(ss('There it is! I found it.')).toEqual(['There it is!', 'I found it.']);
    });

    test('should not split singleton uppercase abbreviations', () => {
      expect(ss('My name is Jonas E. Smith.')).toEqual(['My name is Jonas E. Smith.']);
    });

    test('should not split singleton lowercase abbreviations', () => {
      expect(ss('Please turn to p. 55.')).toEqual(['Please turn to p. 55.']);
    });

    test('should not split two letter lowercase abbreviations in the middle of a sentence', () => {
      expect(ss('Were Jane and co. at the party?')).toEqual(['Were Jane and co. at the party?']);
    });

    test('should not split two letter uppercase abbreviations in the middle of a sentence', () => {
      expect(ss('They closed the deal with Pitt, Briggs & Co. at noon.')).toEqual([
        'They closed the deal with Pitt, Briggs & Co. at noon.',
      ]);
    });

    test('should split two letter lowercase abbreviations at the end of a sentence', () => {
      expect(ss("Let's ask Jane and co. They should know.")).toEqual([
        "Let's ask Jane and co.",
        'They should know.',
      ]);
    });

    test('should split two letter uppercase abbreviations at the end of a sentence', () => {
      expect(ss('They closed the deal with Pitt, Briggs & Co. It closed yesterday.')).toEqual([
        'They closed the deal with Pitt, Briggs & Co.',
        'It closed yesterday.',
      ]);
    });

    test('should not split two letter (prepositive) abbreviations', () => {
      expect(ss('I can see Mt. Fuji from here.')).toEqual(['I can see Mt. Fuji from here.']);
    });

    test('should not split two letter (prepositive & postpositive) abbreviations', () => {
      expect(ss("St. Michael's Church is on 5th st. near the light.")).toEqual([
        "St. Michael's Church is on 5th st. near the light.",
      ]);
    });

    test('should not split possessive two letter abbreviations', () => {
      expect(ss("That is JFK Jr.'s book.")).toEqual(["That is JFK Jr.'s book."]);
    });

    test('should not split multi-period abbreviations in the middle of a sentence', () => {
      expect(ss('I visited the U.S.A. last year.')).toEqual(['I visited the U.S.A. last year.']);
    });

    test('should not split multi-period abbreviations at the end of a sentence', () => {
      expect(ss('I live in the E.U. How about you?')).toEqual([
        'I live in the E.U.',
        'How about you?',
      ]);
    });

    test('should split U.S. as sentence boundary', () => {
      expect(ss('I live in the U.S. How about you?')).toEqual([
        'I live in the U.S.',
        'How about you?',
      ]);
      expect(ss('I live in the (U.S.) How about you?')).toEqual([
        'I live in the (U.S.)',
        'How about you?',
      ]);
    });

    test('should not split U.S. as non-sentence boundary', () => {
      expect(ss('I have lived in the U.S. for 20 years.')).toEqual([
        'I have lived in the U.S. for 20 years.',
      ]);
    });

    test.each([
      'U.S. Government',
      'The U.S. Government policy.',
      'E.U. Commission',
      'U.S.A. Today',
      'Mt. Fuji',
      'The (U.S.) Government issued a statement.',
    ])('should retain abbreviated names in %s', (input) => {
      expect(ss(input)).toEqual([input]);
    });

    test('should not split numbers as a non-sentence boundary', () => {
      expect(ss('She has $100.00 in her bag.')).toEqual(['She has $100.00 in her bag.']);
    });

    test('should split numbers as a sentence boundary', () => {
      expect(ss('She has $100.00. It is in her bag.')).toEqual([
        'She has $100.00.',
        'It is in her bag.',
      ]);
    });

    test('should not split parenthetical inside sentence', () => {
      expect(
        ss(
          'He teaches science (He previously worked for 5 years as an engineer.) at the local University.',
        ),
      ).toEqual([
        'He teaches science (He previously worked for 5 years as an engineer.) at the local University.',
      ]);
    });

    test('should split email addresses as a sentence boundary', () => {
      expect(ss('Her email is Jane.Doe@example.com. I sent her an email.')).toEqual([
        'Her email is Jane.Doe@example.com.',
        'I sent her an email.',
      ]);
    });

    test('should split web addresses as a sentence boundary', () => {
      expect(
        ss(
          'The site is: https://www.example.50.com/new-site/awesome_content.html. Please check it out.',
        ),
      ).toEqual([
        'The site is: https://www.example.50.com/new-site/awesome_content.html.',
        'Please check it out.',
      ]);
    });

    test('should not split single quotations inside sentence', () => {
      expect(ss("She turned to him, 'This is great.' she said.")).toEqual([
        "She turned to him, 'This is great.' she said.",
      ]);
    });

    test('should keep closing double quotes with their sentence', () => {
      expect(ss('He said... "what?" Next.')).toEqual(['He said... "what?"', 'Next.']);
      expect(ss('He said "hello." Then left.')).toEqual(['He said "hello."', 'Then left.']);
      expect(ss('"Hello!" "Goodbye!"')).toEqual(['"Hello!"', '"Goodbye!"']);
      expect(ss('(Stop.) "Next."')).toEqual(['(Stop.)', '"Next."']);
      expect(ss('He moved to the "U.S." How about you?')).toEqual([
        'He moved to the "U.S."',
        'How about you?',
      ]);
      expect(ss('(He said "Stop.") Next came rain.')).toEqual([
        '(He said "Stop.")',
        'Next came rain.',
      ]);
    });

    const quotedContinuations = [
      'Use "e.g." here.',
      '"Dr." is a title.',
      '"U.S." is an abbreviation.',
      'She wrote "etc.", then left.',
      'She wrote "etc." , then left.',
      'She wrote "etc."; then left.',
      'She wrote "etc.": more would follow.',
      'She wrote "hello." then left.',
      'The label was "Hello!" 100 times larger.',
    ];
    test.each(quotedContinuations)('keeps quoted continuations in %s', (input) => {
      expect(ss(input)).toEqual([input]);
    });

    test.each(bracketPairs)('keeps closing %s%s with its sentence', (open, close) => {
      const sentence = `${open}Nobody noticed.${close}`;
      const spaced = `${open} Nobody noticed. ${close}`;
      expect(ss(`${sentence} Next came rain.`)).toEqual([sentence, 'Next came rain.']);
      expect(ss(`${spaced} Next came rain.`)).toEqual([spaced, 'Next came rain.']);
      expect(ss(`${sentence} then left.`)).toEqual([`${sentence} then left.`]);
      expect(ss(`${spaced} then left.`)).toEqual([`${spaced} then left.`]);
      const nested = `He said "${open}Stop. ${close} "`;
      expect(ss(`${nested} Next.`)).toEqual([nested, 'Next.']);
    });

    const uncasedContinuations = [
      'The result was (surprisingly!) 100% accurate.',
      'The result was (surprisingly!) -- completely accurate.',
      'The result was (surprisingly!) $100.',
    ];
    test.each(uncasedContinuations)('keeps the continuation in %s', (input) => {
      expect(ss(input)).toEqual([input]);
    });

    test('should split double exclamation points', () => {
      expect(ss('Hello!! Long time no see.')).toEqual(['Hello!!', 'Long time no see.']);
    });

    test('should split double question marks', () => {
      expect(ss('Hello?? Who is there?')).toEqual(['Hello??', 'Who is there?']);
    });

    test('should split double punctuation (exclamation point + question mark)', () => {
      expect(ss('Hello!? Is that you?')).toEqual(['Hello!?', 'Is that you?']);
    });

    test('should split double punctuation (question mark + exclamation point)', () => {
      expect(ss('Hello?! Is that you?')).toEqual(['Hello?!', 'Is that you?']);
    });

    test('should not split errant newlines in the middle of sentences (PDF)', () => {
      expect(ss('This is a sentence\ncut off in the middle because pdf.')).toEqual([
        'This is a sentence cut off in the middle because pdf.',
      ]);
    });

    test('should not split errant newlines in the middle of sentences', () => {
      expect(ss('It was a cold \nnight in the city.')).toEqual([
        'It was a cold night in the city.',
      ]);
    });

    test('should split lower case list separated by newline', () => {
      expect(ss('features\ncontact manager\nevents, activities\n')).toEqual([
        'features',
        'contact manager',
        'events, activities',
      ]);
    });

    const lineBreaks = ['\n', '\r\n', '\r'];
    test.each(lineBreaks)('should split sentences across %j', (lineBreak) => {
      expect(ss(`Alpha.${lineBreak}Beta.${lineBreak}Gamma.`)).toEqual([
        'Alpha.',
        'Beta.',
        'Gamma.',
      ]);
    });

    test.each(lineBreaks)('should split lists across %j', (lineBreak) => {
      expect(ss(`alpha${lineBreak}beta${lineBreak}gamma`)).toEqual(['alpha', 'beta', 'gamma']);
    });

    test.each(lineBreaks)('should join every sentence wrap across %j', (lineBreak) => {
      expect(ss(`The quick${lineBreak}brown${lineBreak}fox jumps.`)).toEqual([
        'The quick brown fox jumps.',
      ]);
    });

    test('should ignore blank separator chunks', () => {
      expect(ss('\nAlpha.\r\n \t\nBeta.\n')).toEqual(['Alpha.', 'Beta.']);
      expect(ss('alpha\n\n \n beta\n')).toEqual(['alpha', 'beta']);
    });

    test('should preserve text before an unterminated final fragment', () => {
      expect(ss('We chose option A. Next step')).toEqual(['We chose option A.', 'Next step']);
      expect(ss('Use Plan A. Next step')).toEqual(['Use Plan A.', 'Next step']);
      expect(ss('We visited D.C. Today')).toEqual(['We visited D.C.', 'Today']);
    });

    test.each(lineBreaks)('should join line-wrapped name initials across %j', (lineBreak) => {
      expect(ss(`Did you see Albert I.${lineBreak}Jones yesterday?`)).toEqual([
        'Did you see Albert I. Jones yesterday?',
      ]);
    });

    test.each(lineBreaks)('should consume wrapped name fragments once across %j', (lineBreak) => {
      expect(ss(`I met${lineBreak}Albert\tI.${lineBreak}Jones at${lineBreak}Acme.`)).toEqual([
        'I met Albert I. Jones at Acme.',
      ]);
      expect(ss(`I met${lineBreak}Albert\tI.${lineBreak}van der${lineBreak}Meer.`)).toEqual([
        'I met Albert I. van der Meer.',
      ]);
    });

    test('should handle a standalone initialism', () => {
      expect(ss('D.C. Next.')).toEqual(['D.C.', 'Next.']);
    });

    test('should match abbreviation punctuation literally', () => {
      expect(ss('I ate an egg. Tomorrow is Monday.')).toEqual([
        'I ate an egg.',
        'Tomorrow is Monday.',
      ]);
      expect(ss('She ate ice. We left.')).toEqual(['She ate ice.', 'We left.']);
      expect(ss('Use e.g. Examples.')).toEqual(['Use e.g. Examples.']);
      expect(ss('That is i.e. An example.')).toEqual(['That is i.e. An example.']);
    });

    test('should split geo-coordinate as a sentence boundary', () => {
      expect(ss('You can find it at N°. 1026.253.553. That is where the treasure is.')).toEqual([
        'You can find it at N°. 1026.253.553.',
        'That is where the treasure is.',
      ]);
    });

    test('should not split named entities with an exclamation point', () => {
      expect(ss('She works at Yahoo! in the accounting department.')).toEqual([
        'She works at Yahoo! in the accounting department.',
      ]);
    });

    test('should correctly handle I as a sentence boundary and I as an abbreviation', () => {
      expect(ss('We make a good team, you and I. Did you see Albert I. Jones yesterday?')).toEqual([
        'We make a good team, you and I.',
        'Did you see Albert I. Jones yesterday?',
      ]);
    });

    test('should not split ellipsis at end of quotation', () => {
      expect(
        ss(
          'Thoreau argues that by simplifying one\'s life, "the laws of the universe will appear less complex...."',
        ),
      ).toEqual([
        'Thoreau argues that by simplifying one\'s life, "the laws of the universe will appear less complex...."',
      ]);
    });

    test('should not split ellipsis with square brackets', () => {
      expect(ss('"Bohr [...] used the analogy of parallel stairways [...]" (Smith 55).')).toEqual([
        '"Bohr [...] used the analogy of parallel stairways [...]" (Smith 55).',
      ]);
    });

    // ReDoS regression tests - ensure pathological inputs complete quickly
    // Using 500ms threshold to account for CI environment variability
    describe('ReDoS prevention', () => {
      const TIMEOUT_MS = 500;

      test('should segment abbreviation chains within a small heap', () => {
        const bundled = buildSync({
          entryPoints: [join(__dirname, '../src/rouge.ts')],
          bundle: true,
          platform: 'node',
          target: 'node18',
          write: false,
        }).outputFiles[0].text;
        const script = `${bundled}
          for (const [fragment, normalized] of [['Dr. ', 'Dr. '], ['e.g. ', 'e.g. '], ['Dr.\\n', 'Dr. ']]) {
            const summary = fragment.repeat(5000) + 'End.';
            const sentences = module.exports.sentenceSegment(summary);
            if (sentences.length !== 1 || sentences[0] !== normalized.repeat(5000) + 'End.') {
              throw new Error('Sentence content changed');
            }
            if (module.exports.l(summary, 'unmatched') !== 0) {
              throw new Error('Unexpected ROUGE-L match');
            }
          }
          process.stdout.write('ok');
        `;
        const child = spawnSync(process.execPath, ['--max-old-space-size=64'], {
          input: script,
          encoding: 'utf8',
          timeout: 15_000,
        });
        expect(child.error).toBeUndefined();
        expect({ status: child.status, stderr: child.stderr }).toEqual({ status: 0, stderr: '' });
        expect(child.stdout).toBe('ok');
      });

      test('should handle long strings without sentence terminators quickly', () => {
        const input = 'a'.repeat(64_000);
        const start = Date.now();
        const sentences = ss(input);
        const elapsed = Date.now() - start;
        expect(sentences).toEqual([input]);
        expect(elapsed).toBeLessThan(TIMEOUT_MS);
      });

      test('should trim long chunks without rescanning internal spaces', () => {
        const input = `prefix${' '.repeat(64_000)}suffix.`;
        const start = Date.now();
        const sentences = ss(`  ${input}  `);
        const elapsed = Date.now() - start;
        expect(sentences).toEqual([input]);
        expect(elapsed).toBeLessThan(TIMEOUT_MS);
      });

      test('should handle many dots quickly', () => {
        const input = '.'.repeat(10_000);
        const start = Date.now();
        ss(input);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(TIMEOUT_MS);
      });

      test('should handle repeated patterns quickly', () => {
        const input = 'word. '.repeat(1000);
        const start = Date.now();
        ss(input);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(TIMEOUT_MS);
      });

      test('should handle long string with many spaces quickly', () => {
        const input = `${' '.repeat(10_000)}text. more text.`;
        const start = Date.now();
        ss(input);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(TIMEOUT_MS);
      });

      test('should handle many consecutive exclamation marks quickly', () => {
        // Specifically tests CodeQL alert #1 scenario
        const input = `${'!'.repeat(10_000)}`;
        const start = Date.now();
        ss(input);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(TIMEOUT_MS);
      });

      test('should handle mixed punctuation repetitions quickly', () => {
        const input = `${'!?'.repeat(5000)}`;
        const start = Date.now();
        ss(input);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(TIMEOUT_MS);
      });
    });

    // Additional edge case tests for branch coverage
    describe('edge cases', () => {
      test('should handle input with no sentence terminators', () => {
        expect(ss('just some text without any ending')).toEqual([
          'just some text without any ending',
        ]);
      });

      test('should retain unmatched fragments around line breaks', () => {
        expect(ss('intro\nAlpha. Beta.\ntail')).toEqual(['intro', 'Alpha.', 'Beta.', 'tail']);
      });

      test('should handle whitespace-only input', () => {
        // Whitespace gets trimmed to empty string, so no chunks are added to acc
        // Preserve the single-sentence fallback for whitespace-only input.
        expect(ss('   ')).toEqual(['   ']);
        expect(ss('\t\t')).toEqual(['\t\t']);
        expect(ss('\r\n')).toEqual(['\r\n']);
      });

      test('should handle abbreviation followed by lowercase text', () => {
        // Uses 'etc.' which is in ABBR_COMMON
        expect(ss('There are cats, dogs, etc. and more animals.')).toEqual([
          'There are cats, dogs, etc. and more animals.',
        ]);
      });

      test('should handle single letter abbreviation at sentence boundary', () => {
        expect(ss('Please see p. 10 for details.')).toEqual(['Please see p. 10 for details.']);
      });

      test('should handle mid-sentence ellipsis', () => {
        expect(ss('He said.. and then continued.')).toEqual(['He said.. and then continued.']);
        expect(ss('Wait... what?')).toEqual(['Wait... what?']);
        expect(ss('Wait...  what?')).toEqual(['Wait... what?']);
        expect(ss('Wait...\twhat?')).toEqual(['Wait...\twhat?']);
        expect(ss('Wait...what?')).toEqual(['Wait...what?']);
      });

      test.each(lineBreaks)('joins wrapped ellipses across %j', (lineBreak) => {
        expect(ss(`Wait...${lineBreak}what?`)).toEqual(['Wait... what?']);
        expect(ss(`Wait...${lineBreak}what? Next step`)).toEqual(['Wait... what?', 'Next step']);
      });
    });
  });

  describe('treeBankTokenize', () => {
    const tbt = rouge.treeBankTokenize;

    test.each(bracketPairs)('splits final periods through %s%s spacing', (open, close) => {
      expect(tbt(`${open} Nobody noticed. ${close}`)).toEqual([
        open,
        'Nobody',
        'noticed',
        '.',
        close,
      ]);
      expect(tbt(`"${open} Nobody noticed. ${close} "`)).toEqual([
        '``',
        open,
        'Nobody',
        'noticed',
        '.',
        close,
        "''",
      ]);
    });

    test('should return empty array for empty input', () => {
      expect(tbt('')).toEqual([]);
    });

    const whitespace = [' ', '\t', '\n', '\r\n', '\u00a0'];
    test.each(whitespace)('should split words separated by %j', (separator) => {
      expect(tbt(`alpha${separator}beta`)).toEqual(['alpha', 'beta']);
      expect(tbt(`${separator}They'll${separator}go.${separator}`)).toEqual([
        'They',
        "'ll",
        'go',
        '.',
      ]);
    });

    test.each(whitespace)('should not invent tokens for %j', (separator) => {
      expect(tbt(separator.repeat(3))).toEqual([]);
    });

    const uncommonContractions: [string, string[]][] = [
      ['cannot', ['can', 'not']],
      ["d'ye", ['d', "'ye"]],
      ['gimme', ['gim', 'me']],
      ['gonna', ['gon', 'na']],
      ['gotta', ['got', 'ta']],
      ['lemme', ['lem', 'me']],
      ["more'n", ['more', "'n"]],
      ['wanna', ['wan', 'na']],
      ["'tis", ["'t", 'is']],
      ["'twas", ["'t", 'was']],
    ];
    test.each(uncommonContractions)('should split every %s', (word, tokens) => {
      const input = `${word} ${word} ${word.toUpperCase()}`;
      const expected = [...tokens, ...tokens, ...tokens.map((token) => token.toUpperCase())];
      expect(tbt(input)).toEqual(expected);
      // Global patterns must also reset between tokenizer calls.
      expect(tbt(input)).toEqual(expected);
    });

    test("should split 'll contractions", () => {
      expect(tbt("They'll save and invest more.")).toEqual([
        'They',
        "'ll",
        'save',
        'and',
        'invest',
        'more',
        '.',
      ]);
    });

    test("should split n't contractions and trailing commas", () => {
      expect(tbt("hi, my name can't hello,")).toEqual([
        'hi',
        ',',
        'my',
        'name',
        'ca',
        "n't",
        'hello',
        ',',
      ]);
    });

    test('should handle special symbols', () => {
      expect(tbt('Good muffins cost $3.88 in New York.')).toEqual([
        'Good',
        'muffins',
        'cost',
        '$',
        '3.88',
        'in',
        'New',
        'York',
        '.',
      ]);
    });

    test.each([
      ['Note: hello, world:', ['Note', ':', 'hello', ',', 'world', ':']],
      ['12,000 items at 12:30,', ['12,000', 'items', 'at', '12:30', ',']],
      ['12,000,000 and 3.88.', ['12,000,000', 'and', '3.88', '.']],
    ])('should apply Treebank comma and colon rules to %s', (input, expected) => {
      expect(tbt(input)).toEqual(expected);
    });

    test('should handle double quotation marks', () => {
      expect(tbt('"We beat some pretty good teams to get here," Slocum said.')).toEqual([
        '``',
        'We',
        'beat',
        'some',
        'pretty',
        'good',
        'teams',
        'to',
        'get',
        'here',
        ',',
        "''",
        'Slocum',
        'said',
        '.',
      ]);
      expect(tbt('5" nails and "wide" boards.')).toEqual([
        '5',
        "''",
        'nails',
        'and',
        '``',
        'wide',
        "''",
        'boards',
        '.',
      ]);
    });
  });

  describe('jackKnife', () => {
    const jk = rouge.jackKnife;

    const cands = ['a', 'ab', 'abc', 'abcd'];
    const ref = 'abcd';

    const evalFunc = (a: string, b: string): number => a.length + b.length;
    const statTest = (input: number[]): number => input.reduce((a, b) => a + b);

    test('should throw RangeError when less than 2 candidates are provided', () => {
      expect(() => jk(['a'], ref, evalFunc)).toThrow(RangeError);
    });

    test('should return the correct result using default statistical test', () => {
      expect(jk(cands, ref, evalFunc)).toBe(7.75);
    });
    test('should return the correct result using alternative test', () => {
      expect(jk(cands, ref, evalFunc, statTest)).toBe(31);
    });
  });

  describe('fMeasure', () => {
    const fm = rouge.fMeasure;

    test('should throw RangeError for OOB precision input', () => {
      expect(() => fm(10, 0.5)).toThrow(RangeError);
    });
    test('should throw RangeError for OOB recall input', () => {
      expect(() => fm(0.5, 10)).toThrow(RangeError);
    });
    test('should throw RangeError for OOB beta input', () => {
      expect(() => fm(0.5, 0.75, -1)).toThrow(RangeError);
    });

    test('should return pure recall when beta is Infinity', () => {
      expect(fm(0.5, 0.75, Number.POSITIVE_INFINITY)).toBe(0.75);
    });
    test('should correctly compute F1 score (beta=1)', () => {
      expect(fm(0.5, 0.75, 1)).toBe(0.6);
    });
    test('should correctly compute F2 score (beta=2, favors recall)', () => {
      // F2 = (1 + 4) * P * R / (4 * P + R) = 5 * 0.5 * 0.75 / (2 + 0.75) = 1.875 / 2.75
      expect(fm(0.5, 0.75, 2)).toBeCloseTo(1.875 / 2.75, 10);
    });
    test('should correctly compute F0.5 score (beta=0.5, favors precision)', () => {
      // F0.5 = (1 + 0.25) * P * R / (0.25 * P + R) = 1.25 * 0.5 * 0.75 / (0.125 + 0.75)
      expect(fm(0.5, 0.75, 0.5)).toBeCloseTo((1.25 * 0.5 * 0.75) / 0.875, 10);
    });
    test('should return 0 when both precision and recall are 0', () => {
      expect(fm(0, 0, 1)).toBe(0);
    });
    test('should return 0 when precision is 0', () => {
      expect(fm(0, 0.5, 1)).toBe(0);
    });
    test('should return 0 when recall is 0', () => {
      expect(fm(0.5, 0, 1)).toBe(0);
    });
    test('should return 0 when beta=0 and recall=0 (edge case denominator=0)', () => {
      // When beta=0, denominator = 0*p + r = r. If r=0, denominator=0
      expect(fm(0.5, 0, 0)).toBe(0);
    });
  });

  describe('charIsUpperCase', () => {
    const isUpper = rouge.charIsUpperCase;

    test('should throw RangeError for non-character input', () => {
      expect(() => isUpper('abcd')).toThrow(RangeError);
    });
    test('should throw RangeError for empty input', () => {
      expect(() => isUpper('')).toThrow(RangeError);
    });

    test('should return true for uppercase input', () => {
      expect(isUpper('A')).toBe(true);
    });
    test('should return false for lowercase input', () => {
      expect(isUpper('a')).toBe(false);
    });
    test('should return false for non-alphabetical input', () => {
      expect(isUpper('1')).toBe(false);
    });

    test('should return true for uppercase international characters', () => {
      expect(isUpper('Ü')).toBe(true);
      expect(isUpper('É')).toBe(true);
      expect(isUpper('Ñ')).toBe(true);
    });
    test('should return false for lowercase international characters', () => {
      expect(isUpper('ü')).toBe(false);
      expect(isUpper('é')).toBe(false);
      expect(isUpper('ñ')).toBe(false);
    });
  });

  describe('strIsTitleCase', () => {
    const isTitle = rouge.strIsTitleCase;

    test('should return true for titlecase input', () => {
      expect(isTitle('Abcd')).toBe(true);
    });
    test('should return false for all lowercase input', () => {
      expect(isTitle('abcd')).toBe(false);
    });
    test('should return false for lowercase input with interspesed capitals', () => {
      expect(isTitle('aBcD')).toBe(false);
    });

    test('should return false when there is no first character', () => {
      expect(isTitle('')).toBe(false);
      expect(isTitle(' \t\r\n')).toBe(false);
    });
  });
});

describe('Core Functions', () => {
  const metrics = [
    ['ROUGE-N', rouge.n],
    ['ROUGE-S', rouge.s],
    ['ROUGE-L', rouge.l],
  ] as const;
  describe.each(metrics)('%s input handling', (_name, score) => {
    test('should treat word-separating whitespace consistently', () => {
      expect(score('alpha\tbeta', 'alpha beta')).toBe(1);
      expect(score('alpha\nbeta', 'alpha beta')).toBe(1);
      expect(score('alpha\u00a0beta', 'alpha beta')).toBe(1);
    });

    test('should reject whitespace-only summaries like empty strings', () => {
      expect(() => score(' \t\r\n', 'alpha beta')).toThrow('Candidate cannot be an empty string');
      expect(() => score('alpha beta', ' \t\r\n')).toThrow('Reference cannot be an empty string');
    });

    test('should separate colons without splitting numeric commas', () => {
      expect(score('Note: 12,000 items', 'Note : 12,000 items')).toBe(1);
      expect(score('12,000 items', '12 000 items')).toBeLessThan(1);
    });

    test.each([
      ['He said... "what?" Next.', "He said ... `` what ? '' Next ."],
      ['Use "e.g." here.', "Use `` e.g. '' here ."],
      ['"Dr." is a title.', "`` Dr. '' is a title ."],
      ['"U.S." is an abbreviation.', "`` U.S. '' is an abbreviation ."],
      ['She wrote "etc.", then left.', "She wrote `` etc. '' , then left ."],
    ])('preserves quoted token identities in %s', (input, tokens) => {
      expect(score(input, tokens)).toBe(1);
    });

    test.each(bracketPairs)('keeps %s%s spacing equivalent', (open, close) => {
      const sentence = `${open}Nobody noticed.${close}`;
      const spaced = `${open} Nobody noticed. ${close}`;
      expect(score(`${sentence} Next came rain.`, `${spaced} Next came rain.`)).toBe(1);
      expect(score(`${sentence} then left.`, `${spaced} then left.`)).toBe(1);
      expect(
        score(`He said "${open}Stop.${close}" Next.`, `He said "${open}Stop. ${close} " Next.`),
      ).toBe(1);
    });
  });

  describe.each([
    ['ROUGE-N', rouge.n],
    ['ROUGE-S', rouge.s],
  ] as const)('%s summary tokenization', (_name, score) => {
    test('should tokenize each sentence before flattening the token stream', () => {
      expect(score('Alpha. Beta.', 'Alpha . Beta .')).toBe(1);
      expect(score('Alpha. Beta.', 'alpha . beta .', { caseSensitive: false })).toBe(1);
      expect(
        score('Use etc. Another sentence.', 'use etc . another sentence .', {
          caseSensitive: false,
        }),
      ).toBe(1);
    });

    test('should pass complete summaries to custom tokenizers', () => {
      const tokenizer = jest.fn((input: string): string[] => input.split(' '));
      expect(score('Alpha. Beta.', 'alpha. beta.', { tokenizer, caseSensitive: false })).toBe(1);
      expect(tokenizer.mock.calls).toEqual([['alpha. beta.'], ['alpha. beta.']]);
    });

    test('should use sentence tokenization for the explicitly supplied built-in tokenizer', () => {
      expect(score('Alpha. Beta.', 'Alpha . Beta .', { tokenizer: rouge.treeBankTokenize })).toBe(
        1,
      );
    });

    test('should not split a period off an acronym inside a name', () => {
      const tokenizer = (input: string): string[] => rouge.treeBankTokenize(input);
      expect(score('U.S. Government', 'U.S Government')).toBe(
        score('U.S. Government', 'U.S Government', { tokenizer }),
      );
    });
  });

  describe('ROUGE-N', () => {
    const { n } = rouge;

    const cand = 'pulses may ease schizophrenic voices';
    const refs = [
      'magnetic pulse series sent through brain may ease schizophrenic voices',
      'yale finds magnetic stimulation some relief to schizophrenics imaginary voices',
    ];

    test('should give reordered sentence unigrams a perfect score', () => {
      expect(n('Alpha. Beta.', 'Beta. Alpha.')).toBe(1);
    });

    test('should throw RangeError for empty candidate', () => {
      expect(() => n('', refs[0], { n: 2 })).toThrow(RangeError);
    });
    test('should throw RangeError for empty ref', () => {
      expect(() => n(cand, '', { n: 2 })).toThrow(RangeError);
    });

    test('should correctly compute ROUGE-N F1-score for ref 1', () => {
      // 3 matching bigrams, 4 candidate bigrams, 9 reference bigrams
      // precision = 3/4, recall = 3/9 = 1/3
      // F1 = 2 * P * R / (P + R) = 2 * (3/4) * (1/3) / (3/4 + 1/3) = 6/13
      expect(n(cand, refs[0], { n: 2, beta: 1 })).toBe(6 / 13);
    });
    test('should correctly compute ROUGE-N F1-score for ref 2', () => {
      expect(n(cand, refs[1], { n: 2, beta: 1 })).toBe(0);
    });

    test.each<[number, string]>([
      [1, 'the cat sat on the mat'],
      [2, 'a b a b'],
      [3, 'a b a b a'],
    ])('should give repeated %i-gram identity a perfect score', (size, text) => {
      expect(n(text, text, { n: size })).toBe(1);
    });

    test('should count each matching occurrence up to the reference frequency', () => {
      expect(n('a a a b', 'a a b b')).toBeCloseTo(3 / 4);
    });

    test.each([
      [0, 2 / 3],
      [1, 4 / 5],
      [Number.POSITIVE_INFINITY, 1],
    ])('should clip repeated matches with beta=%s', (beta, expected) => {
      expect(n('a a a', 'a a', { beta })).toBeCloseTo(expected);
    });

    test('should count repeated grams from custom tokenizer and ngram callbacks', () => {
      const tokenizer = (text: string): string[] => text.split('');
      const nGram = (tokens: string[]): string[] => tokens;
      expect(n('aaa', 'aa', { tokenizer, nGram })).toBeCloseTo(4 / 5);
    });

    test('should correctly compute ROUGE-N score with custom beta', () => {
      // With beta=0, F-score equals precision
      // 3 matching bigrams out of 4 candidate bigrams = 3/4
      expect(n(cand, refs[0], { n: 2, beta: 0 })).toBe(3 / 4);
    });
    test('should return 0 for no matches', () => {
      expect(n(cand, refs[1], { n: 2, beta: 0 })).toBe(0);
    });
  });

  describe('ROUGE-S', () => {
    const { s } = rouge;

    const ref = 'police killed the gunman';
    const cands = ['police kill the gunman', 'the gunman kill police', 'the gunman police killed'];

    test('should throw RangeError for empty candidate', () => {
      expect(() => s('', ref, undefined as any)).toThrow(RangeError);
    });
    test('should throw RangeError for empty ref', () => {
      expect(() => s(cands[0], '', undefined as any)).toThrow(RangeError);
    });

    test('should return 0 for summaries with zero overlap', () => {
      expect(s('banana yoghurt', ref, undefined as any)).toBe(0);
    });

    test('should correctly compute ROUGE-S score for cand 1 with different opts', () => {
      expect(s(cands[0], ref, { beta: 1 })).toBe(1 / 2);
    });
    test('should correctly compute ROUGE-S score for cand 2 with different opts', () => {
      expect(s(cands[1], ref, { beta: 1 })).toBe(1 / 6);
    });
    test('should correctly compute ROUGE-S score for cand 3 with different opts', () => {
      expect(s(cands[2], ref, { beta: 1 })).toBe(1 / 3);
    });

    test.each([1, 2, Number.POSITIVE_INFINITY])('should count repeats at window %s', (maxSkip) => {
      expect(s('a a a', 'a a a', { maxSkip })).toBe(1);
    });

    test.each([
      [0, 1 / 2],
      [1, 2 / 3],
      [Number.POSITIVE_INFINITY, 1],
    ])('should clip repeated skip-bigram matches with beta=%s', (beta, expected) => {
      expect(s('a a a a', 'a a a', { beta })).toBeCloseTo(expected);
    });

    test('should use the bounded skip-bigram counts as denominators', () => {
      expect(s('a a a a', 'a a a', { maxSkip: 2 })).toBeCloseTo(3 / 4);
    });

    test('should preserve the zero-window behavior', () => {
      expect(s('a b', 'a b', { maxSkip: 0 })).toBe(0);
    });

    test('should respect maxSkip option', () => {
      // With maxSkip=1, only adjacent pairs are considered
      // cand: 'police kill the gunman' -> adjacent pairs: 'police kill', 'kill the', 'the gunman'
      // ref: 'police killed the gunman' -> adjacent pairs: 'police killed', 'killed the', 'the gunman'
      // Only 'the gunman' matches, so precision = 1/3, recall = 1/3, F1 = 1/3
      expect(s(cands[0], ref, { beta: 1, maxSkip: 1 })).toBe(1 / 3);
    });
  });

  describe('ROUGE-L', () => {
    const { l } = rouge;

    const ref = 'police killed the gunman';
    const cands = ['police kill the gunman', 'the gunman kill police', 'the gunman police killed'];

    test('should preserve word separation after an ellipsis for custom tokenizers', () => {
      const tokenizer = (input: string): string[] => input.split(/\s+/);
      expect(l('what?', 'Wait... what?', { tokenizer })).toBeCloseTo(2 / 3);
    });

    test('should preserve word order across wrapped ellipses', () => {
      expect(l('what Wait', 'Wait...\nwhat?')).toBeCloseTo(1 / 3, 15);
    });

    test('should preserve word order through a parenthetical continuation', () => {
      expect(
        l(
          '100 accurate The result was surprisingly',
          'The result was (surprisingly!) 100% accurate.',
        ),
      ).toBeCloseTo(8 / 17, 15);
    });

    test('should throw RangeError for empty candidate', () => {
      expect(() => l('', ref, undefined as any)).toThrow(RangeError);
    });
    test('should throw RangeError for empty ref', () => {
      expect(() => l(cands[0], '', undefined as any)).toThrow(RangeError);
    });

    test('should accept newline-separated sentences', () => {
      const tokenizer = (text: string): string[] => text.match(/[A-Za-z]+/g) || [];
      expect(l('Alpha.\r\nBeta.', 'Alpha.\nBeta.', { tokenizer })).toBe(1);
    });

    test('should correctly compute ROUGE-L score for cand 1 with different opts', () => {
      expect(l(cands[0], ref, { beta: 1 })).toBe(3 / 4);
    });
    test('should correctly compute ROUGE-L score for cand 2 with different opts', () => {
      expect(l(cands[1], ref, { beta: 1 })).toBe(1 / 2);
    });
    test('should correctly compute ROUGE-L score for cand 3 with different opts', () => {
      expect(l(cands[2], ref, { beta: 1 })).toBe(2 / 4);
    });

    const identitySummaries = ['a a a', 'the cat sat on the mat', 'Alpha. Beta.'];
    test.each(identitySummaries)('should give identical summaries a perfect score: %s', (text) => {
      expect(l(text, text)).toBe(1);
    });

    test('should union reference positions instead of repeated token values', () => {
      const tokenizer = (text: string): string[] => text.split(/[| ]+/);
      const segmenter = (text: string): string[] => text.split('|');
      expect(l('a b|a', 'a b a', { tokenizer, segmenter })).toBe(1);
    });

    test('should credit each reference position only once across candidate sentences', () => {
      const tokenizer = (text: string): string[] => text.split(/[| ]+/);
      const segmenter = (text: string): string[] => text.split('|');
      expect(l('a|a', 'a b', { tokenizer, segmenter })).toBeCloseTo(1 / 2);
    });

    test.each([
      ['cat dog fish', 2 / 5],
      ['cat', 2 / 3],
    ] as const)('should clip candidate reuse: %s', (text, expected) => {
      const tokenizer = (input: string): string[] => input.match(/[A-Za-z]+/g) || [];
      expect(l(text, 'cat. cat.', { tokenizer })).toBeCloseTo(expected);
    });

    test.each([true, false])('keeps boundaries with caseSensitive=%s', (caseSensitive) => {
      const tokenizer = (text: string): string[] => text.match(/[A-Za-z]+/g) || [];
      const first = 'Alpha works at Acme Co. Beta sleeps near Luna Inc.';
      const second = 'Beta sleeps near Luna Inc. Alpha works at Acme Co.';
      expect(l(first, second, { tokenizer, caseSensitive })).toBe(1);
    });

    test('should preserve custom callbacks and normalize only after segmentation', () => {
      const segmenter = jest.fn((text: string): string[] => text.split('|'));
      const tokenizer = jest.fn((text: string): string[] => text.split(' '));
      const customLcs = jest.fn((a: string[], b: string[]): string[] => rouge.lcs(a, b));
      expect(
        l('A A|B', 'A A B', { segmenter, tokenizer, lcs: customLcs, caseSensitive: false }),
      ).toBe(1);
      expect(segmenter).toHaveBeenCalledWith('A A|B');
      expect(tokenizer).toHaveBeenCalledWith('a a');
      expect(customLcs).toHaveBeenCalledWith(['a', 'a'], ['a', 'a', 'b']);
    });

    test('should use the subsequence selected by a custom LCS callback', () => {
      const customLcs = (): string[] => ['b'];
      expect(l('a b', 'a b', { lcs: customLcs })).toBeCloseTo(1 / 2);
    });

    test('should preserve repeated occurrences returned by a custom LCS callback', () => {
      const customLcs = (): string[] => ['a', 'a'];
      expect(l('a a a', 'a a', { lcs: customLcs })).toBeCloseTo(4 / 5);
    });

    test('should return zero when custom tokenization removes every token', () => {
      expect(l('a', 'b', { tokenizer: () => [] })).toBe(0);
    });

    test('should compute union LCS across all candidate sentences', () => {
      const multiSentCand = 'The cat sat. The dog ran. The bird flew.';
      const multiSentRef = 'The cat sat on the mat.';
      const score = l(multiSentCand, multiSentRef, { beta: 1 });
      // Four matched reference positions, twelve candidate tokens, seven reference tokens.
      expect(score).toBeCloseTo(8 / 19);
    });

    test('should handle multi-sentence summaries correctly', () => {
      // Candidate has words spread across multiple sentences
      const cand = 'Police arrived. They killed the gunman.';
      const reference = 'police killed the gunman';
      const score = l(cand, reference, { beta: 1, caseSensitive: false });
      // LCS should find matches from both candidate sentences
      expect(score).toBeCloseTo(2 / 3);
    });

    test('should correctly distinguish precision from recall', () => {
      // Short candidate, long reference - tests that P and R are not swapped
      // candidate: "the cat" (2 words), reference: "the cat sat" (3 words)
      // LCS: "the cat" (2 words)
      // Correct: Recall = 2/3 (ref coverage), Precision = 2/2 = 1 (candidate precision)
      const shortCand = 'the cat';
      const longRef = 'the cat sat';
      // With beta=Infinity (pure recall), should return recall = 2/3
      const recallScore = l(shortCand, longRef, { beta: Number.POSITIVE_INFINITY });
      expect(recallScore).toBeCloseTo(2 / 3, 5);
    });
  });

  describe('caseSensitive option', () => {
    const { n, s, l } = rouge;

    test('ROUGE-N should be case-sensitive by default', () => {
      expect(n('Hello World', 'hello world')).toBe(0);
    });

    test('ROUGE-N should match when caseSensitive is false', () => {
      expect(n('Hello World', 'hello world', { caseSensitive: false })).toBe(1);
    });

    test('ROUGE-S should be case-sensitive by default', () => {
      expect(s('Hello World', 'hello world')).toBe(0);
    });

    test('ROUGE-S should match when caseSensitive is false', () => {
      expect(s('Hello World', 'hello world', { caseSensitive: false })).toBe(1);
    });

    test('ROUGE-L should be case-sensitive by default', () => {
      expect(l('Hello World', 'hello world')).toBe(0);
    });

    test('ROUGE-L should match when caseSensitive is false', () => {
      expect(l('Hello World', 'hello world', { caseSensitive: false })).toBe(1);
    });

    test('caseSensitive option should work with partial matches', () => {
      // 'The cat' vs 'the CAT sat' - case insensitive should find 2/3 word match
      const score = n('The cat', 'the CAT sat', { caseSensitive: false });
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });
});
