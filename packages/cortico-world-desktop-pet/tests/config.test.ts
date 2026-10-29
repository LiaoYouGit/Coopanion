/** config.ts: which recognizer voice input uses, and how the self-adjustment and touch settings read. */
import { describe, expect, it } from 'vitest';
import { clockMinutes, inClockWindow, SELF_DEFAULT, asrEngineFor, directSettings, selfAdjustMode, touchWakes } from '../src/config.ts';

describe('asrEngineFor', () => {
  it('unset, picks SenseVoice for the languages it hears and Whisper for the other app languages', () => {
    for (const language of ['zh', 'zh-Hant', 'en', 'ja', 'ko']) expect(asrEngineFor('', language, true)).toBe('funasr');
    for (const language of ['fr', 'de', 'es-419', 'pt-BR', 'it', 'ru']) expect(asrEngineFor('', language, true)).toBe('whisper');
  });

  it('keeps a chosen engine; system only where Windows has its recognizer, the language picks elsewhere', () => {
    expect(asrEngineFor('whisper', 'zh', false)).toBe('whisper');
    expect(asrEngineFor('funasr', 'fr', false)).toBe('funasr');
    expect(asrEngineFor('system', 'fr', true)).toBe('system');
    expect(asrEngineFor('system', 'fr', false)).toBe('whisper');
    expect(asrEngineFor('system', 'ja', false)).toBe('funasr');
    expect(asrEngineFor('api', 'fr', false)).toBe('api');
  });

  it('reads a value this version does not take as unset', () => {
    expect(asrEngineFor('auto', 'de', true)).toBe('whisper');
    expect(asrEngineFor('auto', 'ko', true)).toBe('funasr');
  });
});

describe('selfAdjust', () => {
  it('reads the boolean earlier versions wrote: true as default, false as off', () => {
    expect(selfAdjustMode(true)).toBe('default');
    expect(selfAdjustMode(false)).toBe('off');
    expect(directSettings({ selfAdjust: true })).toEqual(SELF_DEFAULT);
  });

  it('custom takes the per-item picks, any makes every item direct', () => {
    const custom = { ...SELF_DEFAULT, figure: false, sound: true };
    expect(directSettings({ selfAdjust: 'custom', selfAdjustCustom: custom })).toEqual(custom);
    expect(directSettings({ selfAdjust: 'default', selfAdjustCustom: custom })).toEqual(SELF_DEFAULT);
    expect(Object.values(directSettings({ selfAdjust: 'any' })).every(Boolean)).toBe(true);
  });
});

describe('touchWakes', () => {
  it('custom wakes for the picked kinds only', () => {
    const touch = { wakeOn: 'custom' as const, wakeKinds: ['pet', 'drop'] };
    expect(['poke', 'pet', 'throw', 'drop'].filter((k) => touchWakes(touch, k))).toEqual(['pet', 'drop']);
    expect(touchWakes({ wakeOn: 'poke' }, 'pet')).toBe(false);
  });
});

describe('the idle-chat quiet window', () => {
  it('clockMinutes reads HH:MM and rejects the rest', () => {
    expect(clockMinutes('22:00')).toBe(22 * 60);
    expect(clockMinutes('8:05')).toBe(8 * 60 + 5);
    expect(clockMinutes(' 07:59 ')).toBe(7 * 60 + 59);
    expect(clockMinutes('24:00')).toBeNull();
    expect(clockMinutes('12:60')).toBeNull();
    expect(clockMinutes('am 8')).toBeNull();
    expect(clockMinutes('')).toBeNull();
  });

  it('inClockWindow holds across midnight; equal or invalid ends mean no window', () => {
    expect(inClockWindow('22:00', '08:00', 23 * 60)).toBe(true);
    expect(inClockWindow('22:00', '08:00', 0)).toBe(true);
    expect(inClockWindow('22:00', '08:00', 7 * 60 + 59)).toBe(true);
    expect(inClockWindow('22:00', '08:00', 8 * 60)).toBe(false);
    expect(inClockWindow('22:00', '08:00', 21 * 60 + 59)).toBe(false);
    expect(inClockWindow('09:00', '18:00', 12 * 60 + 30)).toBe(true);
    expect(inClockWindow('09:00', '18:00', 9 * 60)).toBe(true);
    expect(inClockWindow('09:00', '18:00', 18 * 60)).toBe(false);
    expect(inClockWindow('08:00', '08:00', 12 * 60)).toBe(false);
    expect(inClockWindow('nope', '08:00', 12 * 60)).toBe(false);
    expect(inClockWindow('22:00', 'also nope', 12 * 60)).toBe(false);
  });
});
