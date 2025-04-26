import { cn } from '@/utils/styling';

describe('styling', () => {
  describe('cn', () => {
    it('concatenates multiple class strings', () => {
      const result = cn('class1 class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles conditional classes using objects', () => {
      const result = cn({ class1: true, class2: false }, 'class3');
      expect(result).toBe('class1 class3');
    });

    it('handles arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles mixed inputs (strings, objects, arrays)', () => {
      const result = cn('class1', { class2: true, class3: false }, ['class4', 'class5']);
      expect(result).toBe('class1 class2 class4 class5');
    });

    it('filters out falsy values', () => {
      const result = cn('class1', undefined, null, false, '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('merges conflicting Tailwind classes', () => {
      const result = cn('p-4 p-2 text-red-500 text-blue-500');
      expect(result).toBe('p-2 text-blue-500');
    });

    it('handles empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('handles nested arrays and objects', () => {
      const result = cn(['class1', ['class2', { class3: true, class4: false }]], { class5: true });
      expect(result).toBe('class1 class2 class3 class5');
    });
  });
});
