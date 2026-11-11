import { useParams } from 'react-router-dom';
import { useColleges } from '../../context/CollegeContext';

/**
 * The college a catalogue page belongs to, from /:collegeslug/... Each college
 * has its own courses, branches and subjects, so every request is scoped to it.
 */
export function useCatalogCollege() {
    const { collegeslug: slug } = useParams();
    const { colleges } = useColleges();
    const college = colleges.find((c) => c.slug === slug) || null;
    return {
        slug,
        college,
        base: `/${slug}`,
        // Query params for the dashboard list endpoints.
        params: { college: slug },
    };
}
