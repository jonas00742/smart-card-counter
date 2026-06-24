import { jest } from '@jest/globals';
import { EventBus } from '../../js/core/EventBus.js';

describe('EventBus', () => {
    test('B-U5: listener registered with on() receives the exact payload on emit()', () => {
        const bus = new EventBus();
        const callback = jest.fn();

        bus.on('SCORE_UPDATED', callback);
        bus.emit('SCORE_UPDATED', { score: 42 });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({ score: 42 });
    });
});
