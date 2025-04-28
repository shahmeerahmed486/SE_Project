// __tests__/sample.test.tsx

import { render, screen } from '@testing-library/react';

describe('Sample Test', () => {
    it('renders a heading', () => {
        render(<h1>Hello, Jest!</h1>);

        const heading = screen.getByText('Hello, Jest!');

        expect(heading).toBeInTheDocument();
    });
});
