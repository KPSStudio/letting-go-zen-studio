// components/layout/UtilityBar.tsx
import Link from 'next/link'

// Thin top utility bar shown above the main navigation.
export default function UtilityBar() {
    return (
        <div className="utility-bar">

            {/* Left side: phone number, account label, and subtle admin link */}
            <div className="utility-left">
                <a
                    href="tel:07590572043"
                    className="utility-phone"
                    aria-label="Call Letting Go Zen Studio"
                >
                    <span className="utility-phone-flag">🇬🇧</span>
                    <span>07590 572 043</span>
                </a>

                <button
                    type="button"
                    className="utility-account"
                    aria-label="Account"
                >
                    ACCOUNT
                </button>

                <Link
                    href="/admin"
                    className="utility-admin"
                    aria-label="Admin panel"
                >
                    Admin
                </Link>
            </div>

            {/* Right side: language, currency, and cart controls */}
            <div className="utility-right">
                <button type="button" className="utility-pill">
                    PL
                </button>

                <span className="utility-divider" aria-hidden="true" />

                <button type="button" className="utility-pill">
                    GB EN
                </button>

                <span className="utility-gap" aria-hidden="true" />

                <button type="button" className="utility-pill utility-currency">
                    £
                </button>

                <button type="button" className="utility-pill utility-currency">
                    zł
                </button>

                <button type="button" className="utility-pill utility-currency">
                    €
                </button>

                <button type="button" className="utility-pill utility-currency">
                    $
                </button>

                <span className="utility-gap" aria-hidden="true" />

                <Link
                    href="/koszyk"
                    className="utility-cart"
                    aria-label="Open cart"
                >
                    <span className="utility-cart-icon">🛒</span>
                    <span>CART</span>
                    <span className="utility-cart-count">0</span>
                </Link>
            </div>
        </div>
    )
}