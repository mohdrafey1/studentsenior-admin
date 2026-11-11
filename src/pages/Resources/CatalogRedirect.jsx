import { Navigate, useLocation } from 'react-router-dom';
import { useColleges } from '../../context/CollegeContext';
import Loader from '../../components/Common/Loader';

/**
 * Where an old /reports/{courses,branches,subjects}/... link now lives: the
 * same page inside a college. That is the college named by ?college= (an id
 * or slug), else the last one opened, else the first. Null when no college
 * is known yet.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function catalogRedirectTarget({
    pathname,
    search,
    colleges,
    currentSlug,
}) {
    const params = new URLSearchParams(search);
    const named = params.get('college');
    params.delete('college');
    const byQuery = named
        ? colleges.find((c) => c._id === named || c.slug === named)
        : null;
    const slug = byQuery?.slug || currentSlug || colleges[0]?.slug;
    if (!slug) return null;
    const rest = pathname.replace(/^\/reports/, '');
    const query = params.toString();
    return `/${slug}${rest}${query ? `?${query}` : ''}`;
}

/** The catalogue used to live under /reports; each college now has its own. */
const CatalogRedirect = () => {
    const { pathname, search } = useLocation();
    const { colleges, loading, currentSlug } = useColleges();
    const target = catalogRedirectTarget({
        pathname,
        search,
        colleges,
        currentSlug,
    });

    if (target) return <Navigate to={target} replace />;
    // No college yet: wait for the list, or go home if there is none.
    return loading || colleges.length === 0 ? (
        <Loader />
    ) : (
        <Navigate to='/dashboard' replace />
    );
};

export default CatalogRedirect;
