import React from 'react';
import { render } from '@testing-library/react-native';
import Icon, { ICON_COLORS } from '../../components/Icon';

describe('Icon Component - Модульное тестирование', () => {
  describe('Базовая функциональность', () => {
    it('должен рендериться с базовыми пропсами', () => {
      const { getByTestId } = render(
        <Icon name="gamepad" size={24} color={ICON_COLORS.primary} testID="test-icon" />
      );
      
      const icon = getByTestId('test-icon');
      expect(icon).toBeDefined();
    });

    it('должен корректно обрабатывать различные размеры', () => {
      const sizes = [16, 24, 32, 48];
      
      sizes.forEach(size => {
        const { getByTestId } = render(
          <Icon name="gamepad" size={size} color={ICON_COLORS.primary} testID={`icon-${size}`} />
        );
        
        const icon = getByTestId(`icon-${size}`);
        expect(icon).toBeDefined();
        expect(icon.props.style).toMatchObject({
          width: size,
          height: size,
        });
      });
    });

    it('должен применять правильные цвета', () => {
      const colors = Object.values(ICON_COLORS);
      
      colors.forEach((color, index) => {
        const { getByTestId } = render(
          <Icon name="gamepad" size={24} color={color} testID={`icon-color-${index}`} />
        );
        
        const icon = getByTestId(`icon-color-${index}`);
        expect(icon).toBeDefined();
      });
    });
  });

  describe('Различные типы иконок', () => {
    const iconNames = [
      'gamepad', 'trophy', 'gear', 'user', 'login', 'users',
      'right', 'left', 'up', 'down', 'pause', 'play'
    ];

    iconNames.forEach(iconName => {
      it(`должен рендерить иконку ${iconName}`, () => {
        const { getByTestId } = render(
          <Icon name={iconName} size={24} color={ICON_COLORS.primary} testID={`icon-${iconName}`} />
        );
        
        const icon = getByTestId(`icon-${iconName}`);
        expect(icon).toBeDefined();
      });
    });
  });

  describe('Обработка ошибок', () => {
    it('должен обрабатывать несуществующие иконки', () => {
      const { getByTestId } = render(
        <Icon name="nonexistent-icon" size={24} color={ICON_COLORS.primary} testID="nonexistent-icon" />
      );
      
      const icon = getByTestId('nonexistent-icon');
      expect(icon).toBeDefined();
    });

    it('должен обрабатывать нулевой размер', () => {
      const { getByTestId } = render(
        <Icon name="gamepad" size={0} color={ICON_COLORS.primary} testID="zero-size-icon" />
      );
      
      const icon = getByTestId('zero-size-icon');
      expect(icon).toBeDefined();
      expect(icon.props.style).toMatchObject({
        width: 0,
        height: 0,
      });
    });

    it('должен обрабатывать отрицательный размер', () => {
      const { getByTestId } = render(
        <Icon name="gamepad" size={-10} color={ICON_COLORS.primary} testID="negative-size-icon" />
      );
      
      const icon = getByTestId('negative-size-icon');
      expect(icon).toBeDefined();
    });
  });

  describe('Константы цветов', () => {
    it('должен иметь правильные значения цветов', () => {
      expect(ICON_COLORS.primary).toBe('#00ffff');
      expect(ICON_COLORS.secondary).toBe('#888888');
      expect(ICON_COLORS.disabled).toBe('#444444');
      expect(ICON_COLORS.success).toBe('#4CAF50');
      expect(ICON_COLORS.error).toBe('#f44336');
    });

    it('все цвета должны быть валидными hex значениями', () => {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      Object.values(ICON_COLORS).forEach(color => {
        expect(color).toMatch(hexRegex);
      });
    });
  });
});