const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5; 

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <nav className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            
            {/* Visibilidad en móvil */}
            <div className="flex-1 flex justify-between sm:hidden">
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                    Página {currentPage} de {totalPages}
                </span>
            </div>

            {/* Visibilidad en desktop */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                
                {/* Texto de conteo de ítems */}
                <div>
                    <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de <span className="font-medium">{totalItems}</span> resultados
                    </p>
                </div>
                
                {/* Botones de navegación */}
                <div>
                    <ul className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        
                        {/* Botón Anterior */}
                        <li>
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <span className="sr-only">Anterior</span>
                                {/* Icono SVG para 'Anterior' */}
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 010 1.06L9.07 10l3.72 3.71a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </li>

                        {/* Números de página Dinámicos */}
                        {pageNumbers.map(number => (
                            <li key={number}>
                                <button
                                    onClick={() => paginate(number)}
                                    aria-current={number === currentPage ? 'page' : undefined}
                                    className={`relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium ${
                                        number === currentPage
                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                            : 'bg-white text-gray-500 hover:bg-gray-50' 
                                    }`}
                                >
                                    {number}
                                </button>
                            </li>
                        ))}
                        
                        {/* Botón Siguiente */}
                        <li>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages || totalItems === 0}
                                className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${currentPage === totalPages || totalItems === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <span className="sr-only">Siguiente</span>
                                {/* Icono para 'Siguiente' */}
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 010-1.06L10.93 10 7.21 6.29a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Pagination;