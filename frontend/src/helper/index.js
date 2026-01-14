
const requestHandler = async (api, setLoading, onSuccess, onError, showToast = true) => {
    try {
        setLoading(true);
        const response = await api();

        const { data } = response;
        if (data.success) {
            onSuccess(data);
        }

    } catch (error) {
        setLoading(false);
        onError(error);
    } finally {
        setLoading(false);
    }
}