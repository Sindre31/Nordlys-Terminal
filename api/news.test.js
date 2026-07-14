import { describe, it, expect } from 'vitest';
import { decode, tag, attr } from './news.js';

describe('decode', () => {
  it('unwraps CDATA and trims', () => {
    expect(decode('<![CDATA[  Equinor Q2  ]]>')).toBe('Equinor Q2');
  });
  it('decodes Norwegian entities and common escapes', () => {
    expect(decode('Norsk Hydro &amp; Yara &#248;kte')).toBe('Norsk Hydro & Yara økte');
    expect(decode('&#197;lesund')).toBe('Ålesund');
    expect(decode('DNB&#39;s')).toBe("DNB's");
    expect(decode('DNB&#039;s')).toBe("DNB's");
  });
});

describe('tag', () => {
  it('extracts inner text of a matching element', () => {
    expect(tag('<item><title>Equinor lifts dividend</title></item>', 'title')).toBe('Equinor lifts dividend');
  });
  it('tolerates attributes on the opening tag', () => {
    expect(tag('<title type="text">Hydro up</title>', 'title')).toBe('Hydro up');
  });
  it('returns empty string when the tag is absent', () => {
    expect(tag('<item></item>', 'title')).toBe('');
  });
});

describe('attr', () => {
  it('reads an attribute from a self-closing enclosure tag (the RSS image case)', () => {
    const block = '<item><enclosure url="https://img.example/a.jpg" type="image/jpeg"/></item>';
    expect(attr(block, 'enclosure', 'url')).toBe('https://img.example/a.jpg');
  });
  it('returns empty string when the tag or attribute is missing', () => {
    expect(attr('<item></item>', 'enclosure', 'url')).toBe('');
    expect(attr('<enclosure type="image/jpeg"/>', 'enclosure', 'url')).toBe('');
  });
});
