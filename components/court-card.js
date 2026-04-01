export function CourtCard({ court, action }) {
  return (
    <article className="court-card">
      <div className="court-card__header">
        <div>
          <p className="court-area">{court.areaLabel}</p>
          <h4 className="court-name">{court.name}</h4>
        </div>
        <span className="court-badge">{court.badge}</span>
      </div>
      <div className="court-meta">
        <span className="court-sport">{court.sportLabel}</span>
        <span className="court-price">السعر: {court.priceLabel}</span>
      </div>
      <p className="court-desc">{court.description}</p>
      {action ? <div className="court-actions">{action}</div> : null}
    </article>
  )
}
