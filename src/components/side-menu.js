import { ScrollArea } from '@/components/scroll-area'
import { cn } from '@/lib/utils'

export const SideMenu = ({ children, title, isInner, className }) => {
  return (
    <ScrollArea
      className={cn(
        'hidden border-[#343438] bg-[#171719] lg:flex lg:flex-col lg:border-r',
        isInner ? 'lg:w-80 xl:w-96' : 'lg:w-60 xl:w-72',
        className
      )}
    >
      {title && (
        <div className="sticky top-0 z-10 border-b border-[#343438] bg-[#171719] px-5 py-3">
          <span className="font-sans text-sm font-medium text-[#f0eff1]">{title}</span>
        </div>
      )}
      <div className="bg-[#171719] p-3">{children}</div>
    </ScrollArea>
  )
}
