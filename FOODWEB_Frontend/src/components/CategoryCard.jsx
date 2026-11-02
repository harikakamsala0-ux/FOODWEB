function CategoryCard({
  category,
  active,
  onClick,
}) {
  return (
    <button
      className={`category-card ${
        active ? "category-active" : ""
      }`}
      onClick={onClick}
    >

      <div className="category-icon">
        {category.icon}
      </div>

      <span>{category.name}</span>

      <div className="category-arrow">
        ↗
      </div>

    </button>
  );
}

export default CategoryCard;
