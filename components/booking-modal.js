'use client'

export function BookingModal({ isOpen, title, meta, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="close-btn" type="button" onClick={onClose} aria-label="إغلاق">
          ×
        </button>
        <p className="eyebrow">Booking request</p>
        <h3>{title}</h3>
        <p className="modal-meta">{meta}</p>
        <form className="booking-form">
          <label>
            الاسم
            <input type="text" placeholder="اسمك" />
          </label>
          <label>
            رقم الهاتف
            <input type="tel" placeholder="01xxxxxxxxx" />
          </label>
          <label>
            الموعد المطلوب
            <input type="datetime-local" />
          </label>
          <button type="button" className="primary-btn">
            تأكيد الطلب
          </button>
        </form>
      </div>
    </div>
  )
}
