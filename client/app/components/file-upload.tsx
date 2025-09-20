'use client'
import { defaultMaxListeners } from 'events';
import * as  React from 'react';
import { CloudUpload } from 'lucide-react';

const FileUploadComponent: React.FC = () => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {

        const el = document.createElement('input');
            el.setAttribute('type', 'file');
            el.setAttribute('accept', 'application/pdf');
            el.addEventListener('change', async (ev) => {
                if(el.files && el.files.length > 0) {
                    console.log('Thats my PDF : ',el.files);
                    const file = el.files.item(0);
                    if(file){
                    const formData = new FormData();
                    formData.append('pdf', file);

                    await fetch('http://localhost:8000/uload-pdf',{
                        method: 'POST',
                        body: formData,
                });
                console.log("File Uploaded.");
            }
            }
            })
            el.click();
    };

    return (
        <div className='bg-slate-900 text-white shadow-2xl flex justify-center items-center p-4 rounded-lg border-white border-2'>
        <div onClick={handleUploadClick} className='flex justify-center items-center flex-col'>
        <h3>Upload PDF File</h3>
        <CloudUpload />
        </div>
        </div>
    )
}

export default FileUploadComponent;