
import { useRef, useEffect, useMemo, useState } from 'react'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    FilterFn
} from '@tanstack/react-table'
// import Table from '@/components/ui/Table'
import Checkbox from '@/components/ui/Checkbox'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import type { CheckboxProps } from '@/components/ui/Checkbox'
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'
import { Button, Dialog, FormItem, Input, Notification, Select, Upload, toast } from '@/components/ui'
import Pagination from '@/components/ui/Pagination'
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import { apiGetCrmFileManagerShareContractFile, apiGetCrmProjectShareContractApproval, apiGetCrmProjectShareQuotation, apiGetCrmProjectShareQuotationApproval, apiGetCrmUsersInContractFileApproval, apiGetUsers } from '@/services/CrmService'
import { use } from 'i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRoleContext } from '@/views/crm/Roles/RolesContext'
import { rankItem } from '@tanstack/match-sorter-utils'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import NoData from '@/views/pages/NoData'
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton'

type FormData = {
    user_name: string;
    file_id: string;
    folder_name: string;
    project_id: string;
    client_name: string;
    client_email: string;
    type: string;
};



type CheckBoxChangeEvent = ChangeEvent<HTMLInputElement>

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, 'onChange'> {
    onChange: (event: CheckBoxChangeEvent) => void;
    indeterminate: boolean;
    onCheckBoxChange?: (event: CheckBoxChangeEvent) => void;
    onIndeterminateCheckBoxChange?: (event: CheckBoxChangeEvent) => void;
}

// const { Tr, Th, Td, THead, TBody } = Table

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'prefix'> {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
}
function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: DebouncedInputProps) {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div className="flex justify-end">
            <div className="flex items-center mb-4">
                <Input
                    size='sm'
                    {...props}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </div>
    )
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value)

    // Store the itemRank info
    addMeta({
        itemRank,
    })

    // Return if the item should be filtered in/out
    return itemRank.passed
}
export type FileItemProps = {
    data: FileItem[]
    loading: any
    users: any
    fileIdsForApproval:any
    leadData:any
}
export type FileItem = {
    admin_status: string,
    client_status: string,
    file_name: string,
    files: Files[],
    itemId: string,
    remark: string,
    _id: string
}
type Files = {
    fileUrl: string,
    date: string;
    fileId: string;
    fileName: string;
    fileSize: string;
}



function IndeterminateCheckbox({
    indeterminate,
    onChange,
    ...rest
}: IndeterminateCheckboxProps) {
    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (typeof indeterminate === 'boolean' && ref.current) {
            ref.current.indeterminate = !rest.checked && indeterminate
        }
    }, [ref, indeterminate])

    return <Checkbox ref={ref} onChange={(_, e) => onChange(e)} {...rest} />
}


const ContractDetails = (data: FileItemProps) => {
    const [rowSelection, setRowSelection] = useState({})
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [dialogIsOpen, setIsOpen] = useState(false) 
    const [loading, setLoading] = useState(false)
    const [remark, setRemark] = useState("");
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const leadId :any = queryParams.get('id')
    const [approvalLoading, setApprovalLoading] = useState(false)
    const { roleData } = useRoleContext()
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    // const [users, setUsers] = useState<any>([])
    const [globalFilter, setGlobalFilter] = useState('') 
    const org_id:any= localStorage.getItem('orgId')
    const user_id:any= localStorage.getItem('userId')
    // console.log(data.users)
    // console.log(data.loading)

    

    // useEffect(() => {

    //     const usersWithUpdateContract = data.users.filter((user:any) => 

    //         (!user.access || (user.access.contract && user.access.contract.includes("update")))
            
    //       );
    //       console.log(usersWithUpdateContract)
      
    //       const filteredList = usersWithUpdateContract.filter((item:any) => 
    //         data.leadData.some((firstItem:any) => firstItem.user_id === item.UserId)
    //       );

    //       setUsers(filteredList)

        

    // }, [data.users])

    const [Users, SetUsers] = useState<any>();
    // console.log(Users)

    useEffect(() => {
            const fetchData = async () => {
                const res = await apiGetUsers();


                const usersWithUpdateContract = res?.data.filter((user:any) => 
    
                    (!user.access || (user.access.contract && user.access.contract.includes("update")))
                    
                  );
                //   console.log(usersWithUpdateContract)
              
                  const filteredList = usersWithUpdateContract.filter((item:any) => 
                    data.leadData.some((firstItem:any) => firstItem.user_id === item.UserId)
                  );
        
                  SetUsers(filteredList)  

                //   console.log(filteredList)
            }
            fetchData();
        }, [data.leadData])



  

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {

        setIsOpen(false)
    }

    const Approval = async (fileID: string, status: string) => {
        setApprovalLoading(true);
        const postData = {
            lead_id: leadId,
            file_id: fileID,
            user_id: user_id,
            status: status,
            remark: remark,
            org_id,
        };
        try {
            const response = await apiGetCrmProjectShareContractApproval(postData);
            setApprovalLoading(false);
            if (response.code === 200) {
                toast.push(
                    <Notification closable type='success' duration={2000}>
                        {response.message}
                    </Notification>
                )
                window.location.reload();
            }
        }
        catch (error) {
            setApprovalLoading(false);
            toast.push(
                <Notification closable type='danger' duration={2000}>
                    Internal Server Error
                </Notification>
            )
        }
    }

    const role = localStorage.getItem('role');



    const ApprovalDailog = (fileId:any,)=> {

        const [dialogIsOpen2, setIsOpen2] = useState(false)
        const [loading2, setLoading2] = useState(false)
        const [users, setUsers] = useState<any>([])

        // useEffect(() => {
        //     const fetchData = async () => {
        //         const data = await apiGetUsers();


        //         const usersWithUpdateContract = data?.data.filter((user:any) => 
    
        //             (!user.access || (user.access.contract && user.access.contract.includes("update")))
                    
        //           );
        //         //   console.log(usersWithUpdateContract)
              
        //           const filteredList = usersWithUpdateContract.filter((item:any) => 
        //             fileId.LeadData.some((firstItem:any) => firstItem.user_id === item.UserId)
        //           );
        
        //           setUsers(filteredList)  
        //     }
        //     fetchData();
        // }, [])
        // console.log(fileId.Users)
        // console.log(Users)

        // useEffect(() => {

        //     const usersWithUpdateContract = fileId.Users.filter((user:any) => 
    
        //         (!user.access || (user.access.contract && user.access.contract.includes("update")))
                
        //       );
        //     //   console.log(usersWithUpdateContract)
          
        //       const filteredList = usersWithUpdateContract.filter((item:any) => 
        //         fileId.LeadData.some((firstItem:any) => firstItem.user_id === item.UserId)
        //       );
    
        //       setUsers(filteredList)
    
            
    
        // }, [fileId.Users])

        const openDialog2 = () => {
            setIsOpen2(true)
        }

        const onDialogClose2 = () => {
            setIsOpen2(false)
        }

        const contractApproval = async (values:any) => {
            // console.log(values)
            try {
                const formData = new FormData() 
                formData.append('lead_id', leadId)
                formData.append('folder_name', 'Contract')
                formData.append('file_id', values.file_id)
                formData.append('userId',values.userId)
                formData.append('userEmail',values.email)
                formData.append('type', 'Internal')
                formData.append('org_id', org_id)
                formData.append('user_id', user_id)
    
                const response = await apiGetCrmFileManagerShareContractFile(formData) 
                // console.log(response);
    
                if (response.code === 200) {
                    toast.push(
                    <Notification closable type="success" duration={2000}>
                        Shared for approval successfully
                    </Notification>, { placement: 'top-end' }
                    )
                    window.location.reload();
                    
                }
                else {
                    toast.push(
                    <Notification closable type="danger" duration={2000}>
                        {response.errorMessage}
                    </Notification>, { placement: 'top-end' }
                    )
                }
            } catch (error:any) {
                throw new Error(error);
                
            }
        }

        
        return (<>
            <Button variant='solid' size='sm' onClick={() => openDialog2()}>Share for approval</Button>
            <Dialog
                isOpen={dialogIsOpen2}
                onClose={() => {
                    setLoading2(false);
                    onDialogClose2();
                }}
                onRequestClose={() => {
                    setLoading2(false);
                    onDialogClose2();
                }}
                className={`pb-3`}>
                <h3 className='mb-4'>Share For Approval</h3>
                <Formik
                    initialValues={{
                        userId: '',
                        email: '',
                        file_id: fileId.fileId,
                        type: 'Internal',
                        lead_id: leadId,
                        folder_name: 'contract',
                        user_id: localStorage.getItem('userId'),
                        org_id: localStorage.getItem('orgId'),
                    }}
                    validationSchema={Yup.object({
                        userId: Yup.string().required('UserId is required'),
                        email: Yup.string().required('Email is required'),
                    })}
                    onSubmit={(values, { setSubmitting }) => {


                        
                        // handleSubmit(values);
                        contractApproval(values)
                        setSubmitting(false);
                    }}
                >
                    {({setFieldValue, errors, touched }) => {
                        return (
                            <div className='max-h-96 overflow-y-auto '>
                                <Form className='mr-3'>
                                    <FormItem label='User' asterisk
                                        invalid={errors.userId && touched.userId}
                                        errorMessage={errors.userId}
                                        >

                                            <Select
                                                options={Users.map((user:any) => ({ value: user.UserId, label: user.username, email: user.email }))}
                                                onChange={(option:any) => {
                                                    setFieldValue('userId', option?.value || '')
                                                    setFieldValue('email', option?.email || '')
                                                }}
                                            />
                                    </FormItem>
                                   
                                    <Button className='mt-16' type='submit' block variant='solid' loading={loading2}> {loading2 ? 'Sending' : 'Send'} </Button>
                                </Form>
                            </div>)
                    }}
                </Formik>

            </Dialog>
            </>
        )
    }
    
    const columns =
        useMemo<ColumnDef<FileItem>[]>
            (() => {
                return [
                    {
                        header: 'File Name',
                        accessorKey: 'file_name',
                        cell: ({ row }) => {
                            const fileName = row.original.file_name;
                            const [isHovered, setIsHovered] = useState(false);
                            const hoverTimeout = useRef<any>(null);

                            const handleMouseEnter = () => {
                                if (hoverTimeout.current) {
                                    clearTimeout(hoverTimeout.current);
                                }
                                setIsHovered(true);
                            };

                            const handleMouseLeave = () => {
                                hoverTimeout.current = setTimeout(() => {
                                    setIsHovered(false);
                                }, 200);
                            };
                            return (
                                <div
                                    className='relative inline-block'
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <a href={`${row.original.files[0]}`} className=' cursor-pointer' target='_blank'>
                                        {fileName.length > 31 ? `${fileName.substring(0,31)}...` : fileName}</a>
                                    {isHovered && (
                                        <div className='absolute bottom-0 left-full ml-2 bg-white border border-gray-300 p-2 shadow-lg z-9999 whitespace-nowrap transition-opacity duration-200'>
                                            <p>File Name: {fileName}</p>

                                        </div>
                                    )}
                                </div>
                            );
                        }
                    },

                    {
                        header: 'Admin Status',
                        accessorKey: 'admin_status',
                        cell: ({ row }) => {
                            const fileId = row.original.itemId;
                            const status = row.original.admin_status;
                            const [dialogIsOpen, setIsOpen] = useState(false)


                            const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                                setRemark(event.target.value);
                            };

                            const openDialog1 = (fileId: string) => {
                                setIsOpen(true)
                            }

                            const onDialogClose1 = () => {
                                setIsOpen(false)
                            }
                            return (
                                status === 'approved' ? (
                                    <div>Approved</div>
                                ) : status === 'rejected' ? (
                                    <div>Rejected</div>
                                ) : status === 'pending' ? (
                                    ((role === 'SUPERADMIN' || roleData?.data?.contract?.update?.includes(`${role}`))) ? (
                                        (role === 'SUPERADMIN' || data.fileIdsForApproval.includes(fileId)) ? (

                                            <div>
                                                    <div className='flex gap-1'>
                                                    <Button variant='solid' size='sm' onClick={() => Approval(fileId, 'approved')}>{approvalLoading ? "Approving..." : 'Approve'}</Button>
                                                    <Button variant='solid' color='red-600' size='sm' onClick={() => openDialog1(fileId)}>Reject</Button>
                                                    <Dialog
                                                        isOpen={dialogIsOpen}
                                                        onClose={onDialogClose1}
                                                        onRequestClose={onDialogClose1}
                                                    >
                                                        <h3 className='mb-4'> Reject Remarks</h3>
                                                        <Formik
                                                            initialValues={{ lead_id: leadId, file_id: fileId, status: 'rejected', remark: '', org_id }}
                                                            validationSchema={Yup.object({ remark: Yup.string().required('Required') })}
                                                            onSubmit={async (values, { setSubmitting }) => {
                                                                setSubmitting(true);
                                                                const response = await apiGetCrmProjectShareContractApproval(values);
                                                                setSubmitting(false);
                                                                if (response.code === 200) {
                                                                    toast.push(
                                                                        <Notification closable type='success' duration={2000}>
                                                                            {response.message}
                                                                        </Notification>
                                                                    )
                                                                    window.location.reload();
                                                                }
                                                                else {
                                                                    toast.push(
                                                                        <Notification closable type='danger' duration={2000}>
                                                                            {response.errorMessage}
                                                                        </Notification>
                                                                    )
                                                                }

                                                                setSubmitting(false);
                                                            }}
                                                        >
                                                            {({ handleSubmit, isSubmitting }) => (
                                                                <Form>
                                                                    <FormItem label="Remark">
                                                                        <Field name="remark"    >
                                                                            {({ field, form }: any) => (
                                                                                <Input
                                                                                    textArea
                                                                                    {...field}
                                                                                    onChange={
                                                                                        (e: React.ChangeEvent<HTMLInputElement>) => {
                                                                                            handleInputChange(e);
                                                                                            form.setFieldValue(field.name, e.target.value);
                                                                                        }
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>
                                                                    <div className='flex justify-end'>
                                                                        <Button type="submit" variant='solid' loading={isSubmitting}>{isSubmitting ? 'Submitting' : 'Submit'}</Button>
                                                                    </div>
                                                                </Form>)}
                                                        </Formik>
                                                    </Dialog>
                                                </div>

                                            </div>
                                            ) : (<div className=''>

                                                <div className=''>
                                                    Pending for approval
                                                </div>
                                                
                                                </div>)
                                        ) : (
                                            data.fileIdsForApproval.includes(fileId) ?  (
                                                <div>you have not access to approve</div>

                                            ) : (
                                                <div className=''>

                                                <div className='mb-2'>
                                                    Pending for approval 
                                                </div>                                                
                                                </div> 

                                            )
                                        )
                                    ) 
                                    : (

                                        <span className=' flex flex-col items-start gap-2'>

                                        <ApprovalDailog fileId={fileId} Users={Users} LeadData={data.leadData}/>

                                        { role === 'SUPERADMIN' &&
                                            
                                            <div className='flex gap-1'>
                                                    <Button variant='solid' size='sm' onClick={() => Approval(fileId, 'approved')}>{approvalLoading ? "Approving..." : 'Approve'}</Button>
                                                    <Button variant='solid' color='red-600' size='sm' onClick={() => openDialog1(fileId)}>Reject</Button>
                                                    <Dialog
                                                        isOpen={dialogIsOpen}
                                                        onClose={onDialogClose1}
                                                        onRequestClose={onDialogClose1}
                                                    >
                                                        <h3 className='mb-4'> Reject Remarks</h3>
                                                        <Formik
                                                            initialValues={{ lead_id: leadId, file_id: fileId, status: 'rejected', remark: '', org_id }}
                                                            validationSchema={Yup.object({ remark: Yup.string().required('Required') })}
                                                            onSubmit={async (values, { setSubmitting }) => {
                                                                setSubmitting(true);
                                                                const response = await apiGetCrmProjectShareContractApproval(values);
                                                                setSubmitting(false);
                                                                if (response.code === 200) {
                                                                    toast.push(
                                                                        <Notification closable type='success' duration={2000}>
                                                                            {response.message}
                                                                        </Notification>
                                                                    )
                                                                    window.location.reload();
                                                                }
                                                                else {
                                                                    toast.push(
                                                                        <Notification closable type='danger' duration={2000}>
                                                                            {response.errorMessage}
                                                                        </Notification>
                                                                    )
                                                                }

                                                                setSubmitting(false);
                                                            }}
                                                        >
                                                            {({ handleSubmit, isSubmitting }) => (
                                                                <Form>
                                                                    <FormItem label="Remark">
                                                                        <Field name="remark"    >
                                                                            {({ field, form }: any) => (
                                                                                <Input
                                                                                    textArea
                                                                                    {...field}
                                                                                    onChange={
                                                                                        (e: React.ChangeEvent<HTMLInputElement>) => {
                                                                                            handleInputChange(e);
                                                                                            form.setFieldValue(field.name, e.target.value);
                                                                                        }
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>
                                                                    <div className='flex justify-end'>
                                                                        <Button type="submit" variant='solid' loading={isSubmitting}>{isSubmitting ? 'Submitting' : 'Submit'}</Button>
                                                                    </div>
                                                                </Form>)}
                                                        </Formik>
                                                    </Dialog>
                                                </div>}

                                                </span>
                                    )

                            )
        
                        }
                    }
                    ,
                    ...(role !== 'designer' ? [{
                        header: 'Remark',
                        accessorKey: 'remark',
                        cell: ({ row }: any) => {
                            const Remark = row.original.remark;
                            const admin_status = row.original.admin_status;
                            const [dialogIsOpen, setIsOpen] = useState(false)

                            const openDialog = () => {
                                setIsOpen(true)
                            }

                            const onDialogClose = () => {
                                setIsOpen(false)
                            }

                            return (<>
                                {admin_status === 'rejected' &&
                                    <div><Button size='sm' variant='solid' onClick={() => openDialog()}>Remark</Button></div>}
                                <Dialog
                                    isOpen={dialogIsOpen}
                                    onClose={onDialogClose}
                                    onRequestClose={onDialogClose}
                                >
                                    <h3 className='mb-4'>Remarks</h3>
                                    <p style={{ overflowWrap: "break-word" }}>{Remark}</p>
                                </Dialog>
                            </>

                            )
                        }
                    }] : [])
                ]
            },
                [Users, data])

    const table = useReactTable({
        data: data?.data.reverse() || [],
        columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            rowSelection,
            columnFilters,
            globalFilter,
        },
        enableRowSelection: true,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })
    const pageSizeOption = [
        { value: 10, label: '10 / page' },
        { value: 20, label: '20 / page' },
        { value: 30, label: '30 / page' },
        { value: 40, label: '40 / page' },
        { value: 50, label: '50 / page' },
    ]

    const onPaginationChange = (page: number) => {
        table.setPageIndex(page - 1)
    }

    const onSelectChange = (value = 0) => {
        table.setPageSize(Number(value))
    }

    interface FormValues {
        client_name: string;
        email: string;
        file_id: string;
        type: string
        lead_id: string
        folder_name: string
        project_name: string
        site_location: string
        quotation: File[]
        user_id: string

    }
    type Option = {
        value: number
        label: string
    }

    interface SelectFieldProps {
        options: Option[];
        field: any;
        form: any;
    }
    const handleShareFileForApproval = async () => {
        if (selectedFileIds.length === 0) {
            toast.push(
                <Notification closable type="warning" duration={2000}>
                    Please select a file to share
                </Notification>, { placement: 'top-center' }
            )
            return;
        }


        const postData = {
            type: 'Internal',
            file_id: selectedFileIds[0],
            folder_name: 'Quotation',
            lead_id: leadId,
            org_id,
        };
        try {
            const response = await apiGetCrmProjectShareQuotation(postData);

            //   const responseJson=await response.json()
            if (response.ok) {
                toast.push(
                    <Notification closable type="success" duration={2000}>
                        File shared successfully
                    </Notification>, { placement: 'top-center' }
                )
            }
        }
        catch (error) {
            console.error('Error sharing files:', error);
        }
    }

    const SelectField: React.FC<any> = ({ options, field, form }) => (
        <Select
            options={options}
            name={field.name}
            value={options ? options.find((option: any) => option.value === field.value) : ''}
            onChange={(option) => form.setFieldValue(field.name, option ? option.value : '')}
        />
    );
    const handleSubmit = async (values: any) => {
        const formData = new FormData();
        formData.append('client_name', values.client_name);
        formData.append('email', values.email);
        formData.append('file_id', values.file_id);
        formData.append('type', values.type);
        formData.append('lead_id', values.lead_id);
        formData.append('folder_name', values.folder_name);
        formData.append('project_name', values.project_name);
        formData.append('site_location', values.site_location);
        formData.append('user_id', localStorage.getItem('userId') as string);
        formData.append('org_id', localStorage.getItem('orgId') as string);

        setLoading(true);
        values.quotation.forEach((file: File) => {
            formData.append('quotation', file);
        })
        const response = await apiGetCrmFileManagerShareContractFile(formData);
        // const responseData=  await response.json();
        setLoading(false);
        if (response.code === 200) {
            toast.push(
                <Notification closable type='success' duration={2000}>
                    {response.message}
                </Notification>
            )
            window.location.reload();
        }
        else {
            toast.push(
                <Notification closable type='danger' duration={2000}>
                    {response.errorMessage}
                </Notification>
            )
        }


    };

    const navigate = useNavigate() 
    const approvedFiles = data.data.filter(file => file.admin_status === 'approved').map(file => ({ value: file.itemId, label: file.file_name }));

    const [userOption, setUserOption] = useState<any>(); 
    
    useEffect(() => {
        const userData = data.users.map((user:any) => ({ value: user.UserId, label: user.username }));
        setUserOption(userData)

    }, [data.users])
    // console.log(data.users)

  

    return (
        <div>
            <div className='flex items-center gap-2 justify-end'>
                <DebouncedInput
                    value={globalFilter ?? ''}
                    className="p-2 font-lg shadow border border-block"
                    placeholder="Search..."
                    onChange={(value) => setGlobalFilter(String(value))}
                />
                <div className=' flex mb-4 gap-3'>
                    <Button variant='solid' size='sm' onClick={() => openDialog()} >Share to Client</Button>
                </div>
            </div>
             
                <div>
                    <TableContainer className='max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' style={{ boxShadow: 'none'}}>
                        <Table stickyHeader>
                            <TableHead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className='uppercase'>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell key={header.id} colSpan={header.colSpan} sx={{fontWeight:"600"}}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHead>
                            {

                                data.loading ? (
                                                
                                    <TableRowSkeleton
                                        avatarInColumns={[0]}
                                        columns={columns.length}
                                        avatarProps={{ width: 14, height: 14 }}
                                    />
                                        
                                ) : data?.data.length === 0 ? (
                                    <TableBody>
                                        <TableRow>
                                            <TableCell colSpan={columns.length}>
                                                <NoData />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                ) :


                            (<TableBody>
                                {table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} sx={{'&:hover': { backgroundColor: '#dfedfe' }}} >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>)
                            }

                        </Table>
                    </TableContainer>
                    <div className="flex items-center justify-between mt-4">
                        <Pagination
                            pageSize={table.getState().pagination.pageSize}
                            currentPage={table.getState().pagination.pageIndex + 1}
                            total={table.getFilteredRowModel().rows.length}
                            onChange={onPaginationChange}
                        />
                        <div style={{ minWidth: 130 }}>
                            <Select<Option>
                                size="sm"
                                isSearchable={false}
                                value={pageSizeOption.filter(
                                    (option) =>
                                        option.value ===
                                        table.getState().pagination.pageSize
                                )}
                                options={pageSizeOption}
                                onChange={(option) => onSelectChange(option?.value)}
                            />
                        </div>
                    </div>
                </div>
            

            <Dialog
                isOpen={dialogIsOpen}
                onClose={() => {
                    setLoading(false);
                    onDialogClose();
                }}
                onRequestClose={() => {
                    setLoading(false);
                    onDialogClose();
                }}
                className={`pb-3`}>
                <h3 className='mb-4'>Share To Client</h3>
                <Formik
                    initialValues={{
                        client_name: '',
                        email: '',
                        file_id: '',
                        type: 'Client',
                        lead_id: leadId,
                        folder_name: 'contract',
                        project_name: '',
                        site_location: '',
                        user_id: localStorage.getItem('userId'),
                        quotation: []
                    }}
                    validationSchema={Yup.object({
                        client_name: Yup.string().required('Client name is required'),
                        email: Yup.string().email('Invalid email address').required('Client email is equired'),
                        file_id: Yup.string().required('Select atleast one file to upload.'),
                        project_name: Yup.string().required('Project name is required'),
                        site_location: Yup.string().required('Site location is Required.'),
                        quotation: Yup.array().min(1, 'At least one quotation is required')
                    })}
                    onSubmit={(values, { setSubmitting }) => {
                        ;
                        handleSubmit(values);
                        setSubmitting(false);
                    }}
                >
                    {({ errors, touched }) => {
                        return (
                            <div className='max-h-96 overflow-y-auto '>
                                <Form className='mr-3'>
                                    <FormItem label='Client Name' asterisk
                                        invalid={errors.client_name && touched.client_name}
                                        errorMessage={errors.client_name}
                                    >
                                        <Field name="client_name" type="text" component={Input} />
                                    </FormItem>
                                    <FormItem label='Client Email' asterisk

                                        invalid={errors.email && touched.email}
                                        errorMessage={errors.email}
                                    >
                                        <Field name="email" type="text" component={Input} />
                                    </FormItem>
                                    <FormItem label='File' asterisk

                                        invalid={errors.file_id && touched.file_id}
                                        errorMessage={errors.file_id}
                                    >
                                        <Field name="file_id" >
                                            {({ field, form }: any) => (
                                                <SelectField
                                                    options={approvedFiles}
                                                    field={field}
                                                    form={form}
                                                />
                                            )}
                                        </Field>
                                    </FormItem>
                                    <FormItem label='Project Name' asterisk

                                        invalid={errors.project_name && touched.project_name}
                                        errorMessage={errors.project_name}
                                    >
                                        <Field name="project_name" type="text" component={Input} />
                                    </FormItem>
                                    <FormItem label='Site Location' asterisk

                                        invalid={errors.site_location && touched.site_location}
                                        errorMessage={errors.site_location}
                                    >
                                        <Field name="site_location" type="text" component={Input} />
                                    </FormItem>
                                    <FormItem label='Quotation' asterisk
                                    >
                                        <Field name="quotation" type="text">
                                            {({ field, form }: any) => (

                                                <Upload
                                                    accept='.pdf'
                                                    draggable
                                                    onChange={(files) => {
                                                        form.setFieldValue('quotation', files);
                                                    }}
                                                />

                                            )}
                                        </Field>
                                    </FormItem>
                                    <Button type='submit' block variant='solid' loading={loading}> {loading ? 'Submitting' : 'Submit'} </Button>
                                </Form>
                            </div>)
                    }}
                </Formik>

            </Dialog>


            





        </div>
    )
}

export default ContractDetails

