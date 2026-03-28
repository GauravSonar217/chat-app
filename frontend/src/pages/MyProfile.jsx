import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import CustomFormInput from "../component/CustomFormInput";
import { Link, useNavigate } from "react-router-dom";
import { PulseLoader } from "react-spinners";
import { requestHandler } from "../helper";
import { getProfile, updateProfile } from "../controller";
import { toast } from "react-toastify";

const MyProfile = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("/images/png/dummy-user.png");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const getProfileDetails = async () => {
    await requestHandler(
      async () => await getProfile(),
      setLoading,
      (res) => {
        const { data } = res;
        reset({
          fullName: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber || "",
        });
        setPreview(data.avatar || "/images/png/dummy-user.png");
      },
      (err) => {},
    );
  };

  useEffect(() => {
    getProfileDetails();
  }, []);

  const onSubmit = async (data) => {
    const formData = new FormData();

    formData.append("fullName", data.fullName);
    formData.append("phoneNumber", data.phoneNumber);

    if (selectedFile) {
      formData.append("avatar", selectedFile);
    }

    await requestHandler(
      async () => await updateProfile(formData),
      setLoading,
      (res) => {
        toast.success(res.message);
        getProfileDetails();
        setIsEdit(false);
      },
    );
  };

  return (
    <section className="pageContainer">
      <div className="card-body flex justify-center items-center gap-4">
        <div className="profileCard rounded-lg w-full h-full lg:max-w-[60%]">
          <form
            action="submit"
            className="w-full h-full"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="formContainer w-full h-full flex flex-col justify-center items-center md:p-10">
              <div className="bg-[#0C0C1E] bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-full p-[1.5px] rounded-xl">
                <div className="bg-black rounded-xl p-5 md:p-10 h-full flex flex-col justify-center items-center">
                  <h2 className="text-center mb-6">My Profile</h2>
                  <div className="profileCont relative w-35 h-35 md:w-40 md:h-40 border-3 border-white p-1 rounded-full mb-10 md:mb-15">
                    <img
                      src={preview}
                      alt=""
                      className="w-full h-full rounded-full"
                    />
                    {isEdit && (
                      <div
                        onClick={() => fileInputRef.current.click()}
                        className="absolute cursor-pointer bottom-0 right-2 flex justify-center items-center w-12 h-12 bg-gradient-to-b from-[#562B96] to-[#2E105B] rounded-full"
                      >
                        <img
                          src="/images/png/camera.png"
                          alt="edit"
                          className="w-6"
                        />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={!isEdit}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPreview(URL.createObjectURL(file));
                          setSelectedFile(file);
                        }
                      }}
                    />
                  </div>
                  <div className="fieldCont flex flex-col w-full">
                    <div className="flex items-start justify-between gap-5">
                      <CustomFormInput
                        type="text"
                        label="Full Name"
                        name="fullName"
                        parentClass="w-1/2"
                        placeholder="Enter full name"
                        {...register("fullName", {
                          required: "Full name is required",
                        })}
                        error={errors.fullName?.message}
                        disabled={!isEdit}
                      />
                      <CustomFormInput
                        type="email"
                        label="Email"
                        name="email"
                        parentClass="w-1/2"
                        disabled
                        {...register("email")}
                      />
                    </div>
                    <CustomFormInput
                      type="text"
                      label="Phone Number"
                      name="phoneNumber"
                      parentClass="w-1/2 mt-3"
                      placeholder="Enter phone number"
                      {...register("phoneNumber", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^[0-9]{7,15}$/,
                          message: "Enter a valid phone number (7-15 digits)",
                        },
                      })}
                      error={errors.phoneNumber?.message}
                      disabled={!isEdit}
                    />
                  </div>
                  <div className="w-full flex items-center justify-end">
                    {isEdit ? (
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="submit"
                          className="p-2 text-lg font-semibold rounded cursor-pointer mt-6 mb-6 px-5 bg-gradient-to-b from-[#562B96] to-[#2E105B]"
                          disabled={loading}
                        >
                          {loading ? (
                            <PulseLoader size={10} color="#fff" />
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          type="button"
                          className="p-2 text-lg font-semibold rounded cursor-pointer mt-6 mb-6 px-5 bg-gradient-to-b from-[#562B96] to-[#2E105B]"
                          disabled={loading}
                          onClick={() => setIsEdit(!isEdit)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="p-2 text-lg font-semibold flex items-center gap-3 rounded cursor-pointer px-5 bg-gradient-to-b from-[#562B96] to-[#2E105B]"
                          onClick={() => navigate("/dashboard")}
                        >
                          <img
                            src="/images/png/back.png"
                            alt=""
                            className="w-4"
                          />
                          Back to Home
                        </button>
                        <button
                          type="button"
                          className="p-2 text-lg font-semibold rounded cursor-pointer mt-6 mb-6 px-5 bg-gradient-to-b from-[#562B96] to-[#2E105B]"
                          onClick={() => setIsEdit(!isEdit)}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default MyProfile;
