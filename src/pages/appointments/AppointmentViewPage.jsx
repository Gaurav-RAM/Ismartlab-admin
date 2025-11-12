import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Page base
const PageWrapper = styled.div`
  padding: 24px 24px;
  background: #fafbfc;
  min-height: 100vh;
`;

// Breadcrumbs
const Breadcrumb = styled.nav`
  font-size: 15px;
  color: #8a8c93;
  margin-bottom: 16px;
  > span {
    margin-right: 6px;
  }
`;
const TopActionStripone = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  > button {
  float: right;
  margin-top: 4px;
  background: #e5e9fa;
  color: #2851e3;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  padding: 7px 18px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
  &:hover { background: #d1d8fa; }
  }
`
// Top Button Strip
const TopActionStrip = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  > button {
    background: #fc6c82;
    border: none;
    color: #fff;
    padding: 7px 18px;
    border-radius: 6px;
    font-size: 15px;
    font-weight: 500;
    outline: none;
    box-shadow: 0px 3px 14px 0 rgb(234 66 101 / 10%);
    cursor: pointer;
    transition: background 0.2s;
  }
`;

// Two-column layout
const MainGrid = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;
`;

// Left
const MainColumn = styled.div`
  flex: 1 1 0;
  min-width: 600px;
`;

// Right (Sidebar)
const Sidebar = styled.div`
  width: 350px;
  flex-shrink: 0;
`;

// White rounded card
const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px #dce1e7a0;
  padding: 24px;
  margin-bottom: 18px;
`;

// Inline Header in card
const CardHeader = styled.div`
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 18px;
`;

const InfoTable = styled.div`
  width: 100%;
  margin-bottom: 10px;
  display: flex;
  gap: 18px;
`;

const InfoCol = styled.div`
  flex: 1;
`;

const TableRow = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  font-size: 15px;
`;

const TableLabel = styled.div`
  flex: none;
  width: 130px;
  font-weight: 400;
  color: #5e5a6b;
`;

const TableValue = styled.div`
  font-weight: 600;
  color: #232434;
`;

// Icon/avatar for user/lab
const RoundAvatar = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 15px;
  background: #e7e8eb;
`;

// Info group with image and details
const InfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f7f8fa;
  border-radius: 11px;
  padding: 15px 18px;
  margin-bottom: 13px;
`;

const InfoDetails = styled.div`
  min-width: 0;
  .info-title {
    font-weight: 600;
    color: #1e2176;
    font-size: 16px;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .info-ctxt {
    color: #637083;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.8;
  }
`;

// Payment Info details
const PaySectionLabel = styled.div`
  font-weight: 600;
  font-size: 17px;
  margin-bottom: 18px;
`;

const PayRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: ${props => props.bold ? 600 : 400};
  color: ${props =>
    props.color === 'green' ? '#00a86b'
    : props.color === 'red' ? '#e04536'
    : props.color === 'blue' ? '#246dff'
    : props.color === 'orange' ? '#fa8a1c'
    : '#232434'
  };
`;

const PayCard = styled(Card)`
  min-width: 320px;
`;

// Tag for Status
const Status = styled.span`
  font-weight: 600;
  color: ${props =>
    props.variant === 'completed' ? '#0b9331'
    : props.variant === 'pending' ? '#fa8a1c'
    : '#6872d1'
  };
`;

// Styled Back button
const BackBtn = styled.button`
  float: right;
  margin-top: 4px;
  background: #e5e9fa;
  color: #2851e3;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  padding: 6px 16px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
  &:hover { background: #d1d8fa; }
`;

export default function AppointmentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchAppointment = async () => {
      const ref = doc(db, 'appointments', id);
      const d = await getDoc(ref);
      if (d.exists()) setData(d.data());
      else setData(undefined);
    };
    fetchAppointment();
  }, [id]);

  if (data === null) return <PageWrapper>Loading...</PageWrapper>;
  if (data === undefined) return <PageWrapper>Appointment not found.</PageWrapper>;

  // Replace with actual fields depending on your schema
  const lab = data.lab || {};
  const customer = data.customer || {};
  const vendor = data.vendor || {};
  const collector = data.collector || {};
  const payment = {
    amount: data.totalAmount ?? 0,
    discount: data.discount ?? 0,
    subtotal: data.subtotal ?? 0,
    taxes: data.taxes ?? 0,
    serviceTax: data.serviceTax ?? 0,
    collectionFee: data.collectionFee ?? 0,
    grandTotal: data.grandTotal ?? 0,
  };

  return (
    <PageWrapper>
      <Breadcrumb>
        <span>Dashboard</span> / <span>Appointment Details</span>
      </Breadcrumb>
      <div style={{display: "flex",justifyContent:"space-between"}}>
         <TopActionStrip>
        <button>Uploaded Report</button>
        <button>Status History</button>
      </TopActionStrip>
      <TopActionStripone>
      <BackBtn onClick={() => navigate(-1)}>&lt;&lt; Back</BackBtn> 
      </TopActionStripone>
      </div>
     
      <MainGrid>
        <MainColumn>
          <Card>
            <CardHeader>Appointment Info</CardHeader>
            <TableRow>
              <TableLabel>ID</TableLabel>
              <TableValue>#{id}</TableValue>
              <TableLabel style={{ marginLeft: 38 }}>Payment Status:</TableLabel>
              <Status variant={data.paymentStatus?.toLowerCase()}>
                {data.paymentStatus}
              </Status>
            </TableRow>
            <InfoTable>
              <InfoCol>
                <TableRow>
                  <TableLabel>Date & Time</TableLabel>
                  <TableValue>
                    {data.dateTime?.seconds
                      ? new Date(data.dateTime.seconds * 1000).toLocaleString()
                      : '-'}
                  </TableValue>
                </TableRow>
                <TableRow>
                  <TableLabel>Lab Name</TableLabel>
                  <TableValue>{lab.name ?? '-'}</TableValue>
                </TableRow>
                <TableRow>
                  <TableLabel>Test Case</TableLabel>
                  <TableValue>{data.testPackage ?? '-'}</TableValue>
                </TableRow>
                <TableRow>
                  <TableLabel>Appointment Status</TableLabel>
                  <Status variant={data.status?.toLowerCase()}>{data.status}</Status>
                </TableRow>
                <TableRow>
                  <TableLabel>Submission Status</TableLabel>
                  <Status variant={data.submissionStatus?.toLowerCase()}>
                    {data.submissionStatus}
                  </Status>
                </TableRow>
              </InfoCol>
            </InfoTable>
            <TableRow>
              <TableLabel>Sample Collected:</TableLabel>
              <TableValue>{data.sampleCollected || 'lab'}</TableValue>
            </TableRow>
            <TableRow>
              <TableLabel>Symptoms:</TableLabel>
              <TableValue>{data.symptoms || '-'}</TableValue>
            </TableRow>
          </Card>

          <Card>
            <CardHeader style={{ marginBottom: 2 }}>Lab Information</CardHeader>
            <InfoCard>
              {lab.img ? (
                <RoundAvatar src={lab.img} alt="" />
              ) : (
                <RoundAvatar as="div" />
              )}
              <InfoDetails>
                <div className="info-title">{lab.name}</div>
                <div className="info-ctxt">{lab.email} &nbsp; | &nbsp; {lab.phone}</div>
              </InfoDetails>
            </InfoCard>
          </Card>
          <InfoTable>
            <InfoCol>
              <Card>
                <CardHeader style={{ marginBottom: 2 }}>Customer Info</CardHeader>
                <InfoCard>
                  {customer.img ? (
                    <RoundAvatar src={customer.img} alt="" />
                  ) : (
                    <RoundAvatar as="div" />
                  )}
                  <InfoDetails>
                    <div className="info-title">{customer.name}</div>
                    <div className="info-ctxt">
                      {customer.email} &nbsp; | &nbsp; {customer.phone}
                    </div>
                  </InfoDetails>
                </InfoCard>
              </Card>
            </InfoCol>
            <InfoCol>
              <Card>
                <CardHeader style={{ marginBottom: 2 }}>Collector Info</CardHeader>
                <InfoCard>
                  {collector.img ? (
                    <RoundAvatar src={collector.img} alt="" />
                  ) : (
                    <RoundAvatar as="div" />
                  )}
                  <InfoDetails>
                    <div className="info-title">{collector.name}</div>
                    <div className="info-ctxt">
                      {collector.email} &nbsp; | &nbsp; {collector.phone}
                    </div>
                  </InfoDetails>
                </InfoCard>
              </Card>
            </InfoCol>
          </InfoTable>
          <Card>
            <CardHeader style={{ marginBottom: 2 }}>Vendor Info</CardHeader>
            <InfoCard>
              {vendor.img ? (
                <RoundAvatar src={vendor.img} alt="" />
              ) : (
                <RoundAvatar as="div" />
              )}
              <InfoDetails>
                <div className="info-title">{vendor.name}</div>
                <div className="info-ctxt">
                  {vendor.email} &nbsp; | &nbsp; {vendor.phone}
                </div>
              </InfoDetails>
            </InfoCard>
          </Card>
        </MainColumn>
        
        <Sidebar>
            
          <PayCard>
            <PaySectionLabel>Payment Info</PaySectionLabel>
            <PayRow>
              <span>Amount</span>
              <span>${payment.amount.toFixed(2)}</span>
            </PayRow>
            <PayRow color="green">
              <span>Discount (10%)</span>
              <span>
                {payment.discount > 0 ? `-$${payment.discount.toFixed(2)}` : '$0.00'}
              </span>
            </PayRow>
            <PayRow>
              <span>Subtotal</span>
              <span>${payment.subtotal.toFixed(2)}</span>
            </PayRow>
            <PayRow color="red" bold>
              <span>Taxes:</span>
              <span>${payment.taxes.toFixed(2)}</span>
            </PayRow>
            <div style={{
              background: '#f7f8fa',
              borderRadius: 7,
              padding: '9px 13px',
              margin: '13px 0 13px 0'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Applied Tax</div>
              <PayRow>
                <span>Service Tax (5%)</span>
                <span>${payment.serviceTax.toFixed(2)}</span>
              </PayRow>
              <PayRow>
                <span>Home Collection Fee ($10.00)</span>
                <span>${payment.collectionFee.toFixed(2)}</span>
              </PayRow>
            </div>
            <PayRow color="blue" bold style={{ fontSize: 17 }}>
              <span>Grand Total</span>
              <span>${payment.grandTotal.toFixed(2)}</span>
            </PayRow>
           
          </PayCard>
        </Sidebar>
      </MainGrid>
    </PageWrapper>
  );
}
