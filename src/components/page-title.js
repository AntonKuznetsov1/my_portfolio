import { cn } from '@/lib/utils'

/**
 * `text-balance` replaces react-wrap-balancer, which injected an inline
 * <script> to measure the title. React 19 refuses to execute a <script> rendered
 * inside a component, so on the client the measurement never ran and the title
 * fell back to unbalanced wrapping. Native `text-wrap: balance` needs no script
 * and cannot drift out of sync with the server render.
 */
export const PageTitle = ({ title, subtitle, className, ...rest }) => {
  return (
    <div className={cn('mb-6', className)}>
      <h1 className="text-balance" {...rest}>
        {title}
      </h1>
      {subtitle}
    </div>
  )
}
