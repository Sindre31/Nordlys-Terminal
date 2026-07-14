import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { css, chgEl } from './ui';

// React 19 types element props as `unknown`; narrow to what chgEl actually renders.
function props(el: ReactElement): { children: unknown; 'aria-label'?: string } {
  return el.props as { children: unknown; 'aria-label'?: string };
}

describe('css', () => {
  it('parses declarations into a camelCased style object', () => {
    expect(css('font-size:12px; color:#fff')).toEqual({ fontSize: '12px', color: '#fff' });
  });
  it('ignores empty/blank declarations', () => {
    expect(css('color:red;;')).toEqual({ color: 'red' });
    expect(css('')).toEqual({});
  });
});

describe('chgEl', () => {
  it('renders an honest dash for a null change (no fabricated 0.00%)', () => {
    expect(props(chgEl(null)).children).toBe('—');
  });
  it('renders an up arrow and + sign for a positive change', () => {
    const p = props(chgEl(2.5));
    expect(p.children).toBe('▲ +2.50%');
    expect(p['aria-label']).toBe('up 2.50 percent');
  });
  it('renders a down arrow for a negative change', () => {
    const p = props(chgEl(-1.2));
    expect(p.children).toBe('▼ -1.20%');
    expect(p['aria-label']).toBe('down 1.20 percent');
  });
});
