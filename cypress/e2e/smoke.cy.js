describe('Smoke Test', () => {
    it('loads the homepage', () => {
        cy.visit('/');
        // Check for generic content if exact title unknown
        cy.get('body').should('be.visible');
    });

    it('navigates to login', () => {
        cy.visit('/login');
        cy.contains('Welcome Back');
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
    });

    it('redirects dashboard to login when unauthenticated', () => {
        cy.visit('/dashboard');
        cy.url().should('include', '/login');
    });
});
