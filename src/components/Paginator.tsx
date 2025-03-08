import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'react-bootstrap';

const Paginator = (props: any) => {

  const nextClick = (e: any) => {
    e.preventDefault();
    props.onPageChanged(props.currentPage + 1);
  };

  const prevClick = (e: any) => {
    e.preventDefault();
    props.onPageChanged(props.currentPage - 1);
  };

  const totalPages = () => {
    return Math.ceil(props.totalRecords / props.pageLimit);
  };

  return (
    <div className="mr-2">
      <Button disabled={props.currentPage <= 1} variant="primary" onClick={prevClick} className="mx-1 btn-xs" style={{ height: '100%' }}>
        <FontAwesomeIcon icon={['fas', 'chevron-left']} size="sm" />
      </Button>
      <Button disabled={props.currentPage >= totalPages()} variant="primary" onClick={nextClick} className="ml-1 btn-xs" style={{ height: '100%' }}>
        <FontAwesomeIcon icon={['fas', 'chevron-right']} size="sm" />
      </Button>
    </div>
  );
};

export default Paginator;