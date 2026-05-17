import { getAllTestimonials } from "../../../sanity/lib/testimonials";
import Testimonials from "../Testimonials";

export default async function TestimonialsSection() {
  const testimonials = await getAllTestimonials();
  return <Testimonials testimonials={testimonials} />;
}
