// Component Skeleton Loader for Dashboard
export function ComponentSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3" />
            <div className="h-64 bg-gray-800 rounded" />
            <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-gray-800 rounded" />
                <div className="h-32 bg-gray-800 rounded" />
            </div>
        </div>
    )
}

export function TabSkeleton() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-center">
                <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-4" />
                <div className="h-4 bg-gray-700 rounded w-32 mx-auto" />
            </div>
        </div>
    )
}
