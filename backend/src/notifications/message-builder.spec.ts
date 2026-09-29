import { buildMissedMessage } from './message-builder';

describe('buildMissedMessage', () => {
  it('returns null when there are no habits', () => {
    expect(buildMissedMessage('Skin Care', [])).toBeNull();
  });

  it('returns null when all habits are done (silent)', () => {
    expect(
      buildMissedMessage('Skin Care', [
        { title: 'Toner', done: true },
        { title: 'Sunscreen', done: true },
      ]),
    ).toBeNull();
  });

  it('builds a single-habit natural message', () => {
    expect(
      buildMissedMessage('Reading', [{ title: 'Read book', done: false }]),
    ).toEqual({
      title: 'Reading',
      body: 'You didn\'t complete "Read book" today.',
    });
  });

  it('lists multiple missed habits', () => {
    expect(
      buildMissedMessage('Skin Care', [
        { title: 'Toner', done: false },
        { title: 'Sunscreen', done: true },
        { title: 'Moisturizer', done: false },
      ]),
    ).toEqual({
      title: 'Skin Care',
      body: "In today's Skin Care you missed: Toner, Moisturizer.",
    });
  });
});
