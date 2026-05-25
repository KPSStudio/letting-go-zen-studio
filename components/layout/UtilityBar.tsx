// components/layout/UtilityBar.tsx
// This is the thin bar at the very top of every page
// It shows: phone number on the left, language/currency/cart on the right

export default function UtilityBar() {
    return (
        <div className="w-full py-2 px-6 flex justify-between items-center text-sm"
             style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(184,148,42,0.2)' }}>

            {/* Left side — phone number */}
            <a href="tel:07590572043"
               className="text-brand-cream hover:text-brand-gold-lt transition-colors">
                📱 07590 572 043
            </a>

            {/* Right side — language, currency, cart */}
            <div className="flex items-center gap-4">

                {/* Language toggle */}
                <div className="flex items-center gap-2 text-brand-cream">
                    <button className="hover:text-brand-gold transition-colors">🇵🇱 PL</button>
                    <span className="opacity-30">|</span>
                    <button className="hover:text-brand-gold transition-colors">🇬🇧 EN</button>
                </div>

                {/* Currency toggle */}
                <div className="flex items-center gap-2 text-brand-cream">
                    <button className="hover:text-brand-gold transition-colors">£</button>
                    <span className="opacity-30">|</span>
                    <button className="hover:text-brand-gold transition-colors">zł</button>
                </div>

                {/* Cart */}
                <button className="text-brand-cream hover:text-brand-gold transition-colors flex items-center gap-1">
                    🛒 <span>Koszyk</span>
                    <span className="bg-brand-gold text-brand-bg text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            0
          </span>
                </button>

            </div>
        </div>
    )
}