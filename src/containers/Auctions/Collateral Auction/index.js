import * as PropTypes from "prop-types";
import { Col, Row, SvgIcon } from "../../../components/common";
import { connect } from "react-redux";
import { Table } from "antd";
import PlaceBidModal from "./PlaceBidModal";
import "../index.scss";
import FilterModal from "../FilterModal/FilterModal";
import { setPairs } from "../../../actions/asset";
import Bidding from "./Bidding";
import { queryDutchAuctionList , queryDutchBiddingList, queryAuctionParams} from "../../../services/auction";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE, DOLLAR_DECIMALS,
} from "../../../constants/common";
import { message } from "antd";
import {useState, useEffect} from 'react';
import {auctionsData} from "./data";
import {amountConversion, denomConversion} from "../../../utils/coin";
import moment from 'moment';
import {iconNameFromDenom} from "../../../utils/string";
import {commaSeparator} from "../../../utils/number";

const CollateralAuctions = ({ setPairs, address }) => {
  const [pageNumber, setPageNumber] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [inProgress, setInProgress] = useState(false);
  const [params, setParams] = useState({});
  const [auctions, setAuctions] = useState(auctionsData);
  const [biddings, setBiddings] = useState();

  useEffect(() => {
    fetchData();
    queryParams();
  }, [address]);

  const fetchData = () => {
    fetchAuctions((pageNumber - 1) * pageSize, pageSize, true, false);
    fetchBiddings(address);
  };

  const queryParams = () => {
    queryAuctionParams((error, result) => {
      if (error) {
        return;
      }

      setParams(result?.params);
    });
  };

  const handleChange = (value) => {
    setPageNumber(value.current - 1);
    setPageSize(value.pageSize);
    fetchAuctions(
      (value.current - 1) * value.pageSize,
      value.pageSize,
      true,
      false
    );
  };

  const fetchAuctions = (offset, limit, isTotal, isReverse) => {
    setInProgress(true);
    queryDutchAuctionList(offset, limit, isTotal, isReverse, (error, result) => {
      setInProgress(false);

      if (error) {
        message.error(error);
        return;
      }

      setAuctions(result && result.auctions, result && result.pagination);
    });
  };

  const fetchBiddings = (address) => {
    setInProgress(true);
    queryDutchBiddingList(address, (error, result) => {
      setInProgress(false);

      if (error) {
        message.error(error);
        return;
      }

      if (address) {
        setBiddings(
          result && result.biddings,
          result && result.pagination,
          result && result.bidder
        );
      }
    });
  };

  const columns = [
    {
      title: "Auctioned Asset",
      dataIndex: "auctioned_asset",
      key: "auctioned_asset",
      width: 180,
    },
    {
      title: "Bridge Asset",
      dataIndex: "bridge_asset",
      key: "bridge_asset",
      width: 180,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 180,
    },
    {
      title: "End Time",
      dataIndex: "end_time",
      key: "end_time",
      width: 200,
      render: (end_time) => <div className="endtime-badge">{end_time}</div>,
    },
    {
      title: "Current Price",
      dataIndex: "current_price",
      key: "current_price",
      width: 150,
      render: (price) => <>${commaSeparator(Number(price || 0).toFixed(DOLLAR_DECIMALS))}</>,
    },
    {
      title: (
        <>
          <FilterModal setPairs={setPairs} />
        </>
      ),
      dataIndex: "action",
      key: "action",
      align: "right",
      width: 140,
      render: () => (
        <>
          <PlaceBidModal />
        </>
      ),
    },
  ];

  const tableData =
      auctionsData &&
      auctionsData.length > 0 ?
          auctionsData.map((item, index) => {
        return {
          key: index,
          id: item.id,
          auctioned_asset: (
              <>
                <div className="assets-withicon">
                  <div className="assets-icon">
                    <SvgIcon
                        name={iconNameFromDenom(item?.outflow_token_init_amount?.denom)}
                    />
                  </div>
                  {denomConversion(item?.outflow_token_init_amount?.denom)}
                </div>
              </>
          ),
          bridge_asset: (
              <>
                <div className="assets-withicon">
                  <div className="assets-icon">
                    <SvgIcon name={iconNameFromDenom(item?.inflow_token_current_amount?.denom)} />
                  </div>
                  {denomConversion(item?.inflow_token_current_amount?.denom)}
                </div>
              </>
          ),
          end_time: moment(item && item.end_time).format("MMM DD, YYYY HH:mm"),
          quantity:
              item?.outflow_token_current_amount?.amount &&
              amountConversion(item?.outflow_token_current_amount?.amount),
          current_price: item?.outflow_token_current_price,
          action: item,
        };
      }): [];

  return (
    <div className="app-content-wrapper">
      <Row>
        <Col>
          <div className="composite-card py-3">
            <div className="card-content">
              <Table
                className="custom-table liquidation-table"
                dataSource={tableData}
                columns={columns}
                loading={inProgress}
                onChange={(event) => handleChange(event)}
                pagination={{
                  total:
                    auctions && auctions.pagination && auctions.pagination.total,
                  pageSize,
                }}
                scroll={{ x: "100%" }}
              />
            </div>
          </div>
          <div className="more-bottom">
            <h3 className="title">Your Bidding</h3>
            <div className="more-bottom-card">
              <Bidding />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

CollateralAuctions.propTypes = {
  lang: PropTypes.string.isRequired,
  setPairs: PropTypes.func.isRequired,
  address: PropTypes.string,
};

const stateToProps = (state) => {
  return {
    lang: state.language,
    address: state.account.address,
  };
};

const actionsToProps = {
  setPairs,
};

export default connect(stateToProps, actionsToProps)(CollateralAuctions);
