import React from 'react';
import { Download } from 'lucide-react';
import { downloadDataUrl } from '../utils/postcardGenerator';

export default function PostcardModal({ postcardUrl, seatId }) {
  if (!postcardUrl) return null;

  return (
    <div className="postcard-modal">
      <p className="postcard-desc">
        Live 3D snapshot captured from Seat <b>{seatId}</b> with your current sky atmosphere, wing view, and boarding details.
      </p>
      <div className="postcard-preview">
        <img src={postcardUrl} alt={`Aeris Flight EK215 Souvenir Postcard for Seat ${seatId}`} />
      </div>
      <div className="postcard-actions">
        <button
          type="button"
          className="primary"
          onClick={() => downloadDataUrl(postcardUrl, `AERIS-EK215-Seat-${seatId}.png`)}
        >
          <Download size={15} /> Download PNG Postcard
        </button>
      </div>
    </div>
  );
}
