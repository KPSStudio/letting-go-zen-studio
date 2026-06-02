// lib/CartContext.tsx
// Stores the cart items globally across all pages
// Any component can add/remove items using useCart()

'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// What a single cart item looks like
export interface CartItem {
    id:       string
    name:     string
    type:     'sesja' | 'ebook' | 'pakiet'
    gbp:      number
    pln:      number
}

// What the context provides to every component
interface CartContextType {
    items:      CartItem[]
    addItem:    (item: CartItem) => void
    removeItem: (id: string) => void
    clearCart:  () => void
    count:      number
    totalGBP:   number
    totalPLN:   number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])

    // Add item only if not already in cart
    const addItem = (item: CartItem) => {
        setItems(prev =>
            prev.find(i => i.id === item.id) ? prev : [...prev, item]
        )
    }

    // Remove item by ID
    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id))
    }

    const clearCart = () => setItems([])

    const totalGBP = items.reduce((sum, item) => sum + item.gbp, 0)
    const totalPLN = items.reduce((sum, item) => sum + item.pln, 0)

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            clearCart,
            count: items.length,
            totalGBP,
            totalPLN,
        }}>
            {children}
        </CartContext.Provider>
    )
}

// Hook — call this in any component to access the cart
export function useCart() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be used inside CartProvider')
    return ctx
}