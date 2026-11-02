
import CategoryCard from "./CategoryCard";
import { categories } from "../data/categoryData";
import { useNavigate } from "react-router-dom";

function Categories({ selectedCategory, setSelectedCategory }) {
  const navigate = useNavigate();

  return (
    <section className="categories-section" id="categories">
      <div className="section-top">
        <div>
          <span className="section-label">
            EXPLORE YOUR CRAVINGS
          </span>

          <h2>
            What are you <span>in the mood for?</span>
          </h2>
        </div>

        <button
          className="view-all"
          onClick={() => navigate("/restaurants")}
        >
          All Food →
        </button>
      </div>

      <div className="category-grid">
        <CategoryCard
          category={{
            id: 0,
            name: "All Food",
            icon: "🍽️",
          }}
          active={false}
          onClick={() => navigate("/restaurants")}
        />

        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            active={selectedCategory === category.name}
            onClick={() => setSelectedCategory(category.name)}
          />
        ))}
      </div>
    </section>
  );
}

export default Categories;
