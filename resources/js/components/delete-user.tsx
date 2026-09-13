import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import HeadingSmall from '@/components/heading-small';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function DeleteUser() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);
    
    const { 
        data, 
        setData, 
        delete: destroy, 
        processing, 
        reset, 
        errors, 
        clearErrors 
    } = useForm({ password: '' });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset('password'),
        });
    };

    const closeModal = () => {
        setIsDialogOpen(false);
        clearErrors();
        reset('password');
    };

    return (
        <div className="space-y-6">
            <HeadingSmall 
                title="Delete Account" 
                description="Permanently remove your account and all associated data." 
            />
            
            <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-xl p-6 space-y-4">
                <div className="flex items-start space-x-4">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-3xl mt-1" />
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-red-200">Danger Zone</h3>
                        <p className="text-sm text-gray-300">
                            This action is irreversible. Please be certain before proceeding.
                        </p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faTrashAlt} />
                            Delete My Account
                        </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="bg-gray-900/50 backdrop-blur-xl border-red-500/50 text-white">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400" />
                                Are you absolutely sure?
                            </DialogTitle>
                            <DialogDescription className="text-gray-300 pt-2">
                                This action cannot be undone. This will permanently delete your account. 
                                Please type your password to confirm.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={deleteUser} className="space-y-6 pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password-confirm" className="sr-only">Password</Label>
                                <Input
                                    id="password-confirm"
                                    type="password"
                                    name="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="bg-gray-800/60 border-gray-600 focus:ring-red-500"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    autoFocus
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <DialogFooter className="gap-2 sm:justify-end mt-4">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary" onClick={closeModal}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'I understand, delete my account'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}