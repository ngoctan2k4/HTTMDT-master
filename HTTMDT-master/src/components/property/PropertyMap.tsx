export function PropertyMap({ address }: { address: string }) {
    // Generate an embeddable Google Maps URL based on the address
    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    
    return (
        <div className="w-full h-[400px] rounded-xl overflow-hidden border shadow-sm bg-muted/20 relative">
            <iframe 
                src={mapUrl} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
            />
        </div>
    );
}
