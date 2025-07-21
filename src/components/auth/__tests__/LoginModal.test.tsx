import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginModal from '../LoginModal';

describe('LoginModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onLoginSuccess: jest.fn(),
  };

  it('affiche les champs email et mot de passe', () => {
    render(<LoginModal {...defaultProps} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it('appelle onClose quand on clique sur fermer', () => {
    render(<LoginModal {...defaultProps} />);
    const closeBtn = screen.getByRole('button', { name: /fermer/i });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('désactive le bouton connexion pendant le chargement', () => {
    render(<LoginModal {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: /connexion/i });
    fireEvent.click(submitBtn);
    expect(submitBtn).toBeDisabled();
  });
}); 