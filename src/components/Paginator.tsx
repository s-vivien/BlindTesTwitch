const Paginator = (props: any) => {

  const nextClick = (e: any) => {
    e.preventDefault()
    props.onPageChanged(props.currentPage + 1);
  }

  const prevClick = (e: any) => {
    e.preventDefault()
    props.onPageChanged(props.currentPage - 1);
  }

  const totalPages = () => {
    return Math.ceil(props.totalRecords / props.pageLimit);
  }

  return (
    <nav className="paginator text-right">
      <ul className="pagination pagination-sm">
        <li className={props.currentPage <= 1 ? 'page-item disabled' : 'page-item'}>
          { /* eslint-disable-next-line  */}
          <a className="page-link" href="#" aria-label="Previous" onClick={prevClick}>
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
        <li className={props.currentPage >= totalPages() ? 'page-item disabled' : 'page-item'}>
          { /* eslint-disable-next-line  */}
          <a className="page-link" href="#" aria-label="Next" onClick={nextClick}>
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      </ul>
    </nav>
  )
}

export default Paginator
