import { AuthService } from './services/AuthService'

export async function initializeApp() {
    await AuthService.initializeAdmin()
}

// Call this in your app's entry point
initializeApp().catch(console.error) 