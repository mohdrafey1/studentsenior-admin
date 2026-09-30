/**
 * Page padding for the Blog section.
 *
 * The blog pages came from ss-blog-dashboard, which nested its routes under a
 * layout and rendered bare content. The console's shared layout
 * (components/layout/AppLayout) now provides the sidebar and top bar, so this
 * wrapper only gives the pages the same inner spacing as the rest.
 */
export default function BlogShell({ children }) {
    return (
        <div className='min-h-full px-4 sm:px-10 pt-8 pb-12 text-ink'>
            {children}
        </div>
    );
}
