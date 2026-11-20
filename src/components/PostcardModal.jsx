import React from 'react';
import { Download } from 'lucide-react';
import { downloadDataUrl } from '../utils/postcardGenerator';

export default function PostcardModal({ postcardUrl, seatId }) {
  if (!postcardUrl) return null;

  return (
    <div className="postcard-modal">
      <p className="postcard-desc">
        <b>{seatId}</b> 좌석에서 바라본 현재 3D 하늘·날개 풍경과 탑승 정보를 감성 엽서로 합성했습니다.
      </p>
      <div className="postcard-preview">
        <img src={postcardUrl} alt={`AERIS EK215편 ${seatId} 좌석 기념 엽서`} />
      </div>
      <div className="postcard-actions">
        <button
          type="button"
          className="primary"
          onClick={() => downloadDataUrl(postcardUrl, `AERIS-EK215-Seat-${seatId}.png`)}
        >
          <Download size={15} /> PNG 엽서 다운로드
        </button>
      </div>
    </div>
  );
}
