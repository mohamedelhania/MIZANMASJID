import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function MosqueMap({ mosques, onManage }: { mosques: any[]; onManage?: (id: string) => void }) {
  const [LeafletMap, setLeafletMap] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR window is not defined errors
    Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([ReactLeaflet, L]) => {
      // Fix icons
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      setLeafletMap({ ...ReactLeaflet });
    });
  }, []);

  if (!LeafletMap) return <div className="h-[500px] flex items-center justify-center border rounded-xl"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const { MapContainer, TileLayer, Marker, Popup } = LeafletMap;
  const defaultCenter: [number, number] = [40.4168, -3.7038];

  return (
    <div className="h-[500px] rounded-xl overflow-hidden border border-border shadow-sm animate-slide-up relative z-0">
      <MapContainer center={defaultCenter} zoom={6} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mosques.filter(m => m.lat && m.lng).map(m => (
          <Marker key={m.id} position={[Number(m.lat), Number(m.lng)]}>
            <Popup className="rounded-xl">
              <div className="p-1">
                <h3 className="font-bold text-sm mb-1">{m.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{m.address}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-[10px]"
                    onClick={() => onManage?.(m.id)}>
                    Gestionar
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
